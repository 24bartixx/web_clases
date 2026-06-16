import {
  MDBBtn,
  MDBCardText,
  MDBCol,
  MDBContainer,
  MDBRow,
  MDBTabs,
  MDBTabsItem,
  MDBTabsLink,
  MDBTypography,
} from 'mdb-react-ui-kit';
import { TimeUnit, TradingChart, TradingChartPeriod } from './TradingChart';
import stockImg from '../../assets/stock-30.png';
import moneyImg from '../../assets/money-30.png';
import { AmountInput } from './AmountInput';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { CompanyDetailsModal } from './stockDetailsModal';
import {
  mapPriceDtoToPrice,
  mapStockDetailsDtoToStockDetails,
  mapStockDtoToStock,
  Price,
  PriceDto,
  Stock,
  StockDetails,
  StockDetailsDto,
  StockDto,
} from '../../types';
import { InfoModal } from '../../components/InfoModal';
import { apiUrl } from '../../utils/apiUrl';
import {
  addDaysToDateOnly,
  addMonthsToDateOnly,
  toDateOnly,
} from '../../utils';
import { useGame } from '../../contexts/GameContext';
import { CustomLoading } from '../../components/Common/CustomLoading';
import { auth_fetch } from '../../utils/auth_fetch';

enum TradeSideKey {
  Buy = 'buy',
  Sell = 'sell',
}

enum PeriodKey {
  M1 = 'M1',
  M3 = 'M3',
  M6 = 'M6',
  Y1 = 'Y1',
  Y5 = 'Y5',
  ALL = 'ALL',
}

const periods: Record<PeriodKey, TradingChartPeriod> = {
  [PeriodKey.M1]: { amount: 1, unit: TimeUnit.Month },
  [PeriodKey.M3]: { amount: 3, unit: TimeUnit.Month },
  [PeriodKey.M6]: { amount: 6, unit: TimeUnit.Month },
  [PeriodKey.Y1]: { amount: 1, unit: TimeUnit.Year },
  [PeriodKey.Y5]: { amount: 5, unit: TimeUnit.Year },
  [PeriodKey.ALL]: { amount: 0, unit: TimeUnit.All },
};

const INITIAL_HISTORY_MONTHS = 3;
const INITIAL_FUTURE_DAYS = 7;
const FUTURE_FETCH_THRESHOLD_DAYS = 3;
const FUTURE_FETCH_MONTHS = 1;
const DRAG_FETCH_MULTIPLIER = 3;
const DAYS_PER_FETCH_MONTH = 31;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface SellOrBuyForm {
  amount: number;
  total: number;
}

const minDateOnly = (left: string, right: string) =>
  left <= right ? left : right;

const getCappedFetchFinishDate = (
  targetFinishDate: string,
  simulationFinishDate: string | null,
) =>
  simulationFinishDate === null
    ? targetFinishDate
    : minDateOnly(targetFinishDate, addDaysToDateOnly(simulationFinishDate, 1));

const getDateOnlyTime = (dateOnly: string): number => {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

const getDateOnlyDayDiff = (from: string, to: string): number =>
  Math.floor((getDateOnlyTime(to) - getDateOnlyTime(from)) / MS_PER_DAY);

const getVisibleIntervalMonths = (from: string, to: string): number => {
  const dayDiff = Math.max(
    1,
    Math.ceil((getDateOnlyTime(to) - getDateOnlyTime(from)) / MS_PER_DAY),
  );

  return Math.max(1, Math.ceil(dayDiff / DAYS_PER_FETCH_MONTH));
};

const getPeriodStartDate = (
  period: TradingChartPeriod,
  referenceDate: string,
): string | null => {
  if (period.amount <= 0 || period.unit === TimeUnit.All) {
    return null;
  }

  switch (period.unit) {
    case TimeUnit.Day:
      return addDaysToDateOnly(referenceDate, -period.amount);
    case TimeUnit.Month:
      return addMonthsToDateOnly(referenceDate, -period.amount);
    case TimeUnit.Year:
      return addMonthsToDateOnly(referenceDate, -period.amount * 12);
    default:
      return null;
  }
};

const mergePriceRanges = (currentPrices: Price[], newPrices: Price[]) => {
  const pricesByDate = new Map<string, Price>();

  [...newPrices, ...currentPrices].forEach((price) => {
    const priceDate = toDateOnly(price.priceDate);

    if (priceDate !== null) {
      pricesByDate.set(priceDate, price);
    }
  });

  return Array.from(pricesByDate.values()).sort((left, right) => {
    const leftDate = toDateOnly(left.priceDate) ?? '';
    const rightDate = toDateOnly(right.priceDate) ?? '';
    return leftDate.localeCompare(rightDate);
  });
};

const getOldestPriceDate = (prices: Price[]): string | null =>
  prices.reduce<string | null>((oldestDate, price) => {
    const priceDate = toDateOnly(price.priceDate);

    if (priceDate === null) {
      return oldestDate;
    }

    return oldestDate === null ? priceDate : minDateOnly(oldestDate, priceDate);
  }, null);

export function TradingViewPage() {
  // prettier-ignore
  const [activeTradeSide, setActiveTradeSide] = useState<TradeSideKey>(TradeSideKey.Buy,);
  const [activePeriod, setActivePeriod] = useState<PeriodKey>(PeriodKey.M3);
  const [isCompanyDetailsOpen, setIsCompanyDetailsOpen] = useState(false);
  const { gameState, makeTransaction } = useGame();

  const navigate = useNavigate();
  const { ticker } = useParams<{ ticker: string }>();
  const cleanTicker = ticker?.toUpperCase() || '';

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [stock, setStock] = useState<Stock | null>(null);
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null);
  const [priceRange, setPriceRange] = useState<Price[] | null>(null);
  const [isLoadingOlderPrices, setIsLoadingOlderPrices] = useState(false);

  const currentPosition = useMemo(
    () =>
      gameState.stockPositions?.find((pos) => pos.stock.ticker === cleanTicker),
    [gameState.stockPositions, cleanTicker],
  );
  const [oldestFetchedDate, setOldestFetchedDate] = useState<string | null>(
    null,
  );
  const [newestFetchedFinishDate, setNewestFetchedFinishDate] = useState<
    string | null
  >(null);
  const [hasFetchedAllBack, setHasFetchedAllBack] = useState(false);
  const isFetchingOlderPricesRef = useRef(false);
  const olderPriceFetchKeyRef = useRef<string | null>(null);
  const isFetchingFuturePricesRef = useRef(false);
  const futurePriceFetchKeyRef = useRef<string | null>(null);

  const simulationDate = gameState.currentDate ?? gameState.startDate;
  const simulationDateOnly = toDateOnly(simulationDate);
  const simulationFinishDateOnly = toDateOnly(gameState.finishDate);
  const priceStartDateOnly = simulationDateOnly
    ? addMonthsToDateOnly(simulationDateOnly, -INITIAL_HISTORY_MONTHS)
    : null;
  const priceFinishDateOnly = simulationDateOnly
    ? addDaysToDateOnly(simulationDateOnly, 1)
    : null;
  const initialPriceFinishDateOnly = simulationDateOnly
    ? getCappedFetchFinishDate(
        addDaysToDateOnly(simulationDateOnly, INITIAL_FUTURE_DAYS + 1),
        simulationFinishDateOnly,
      )
    : null;

  const buyForm = useForm<SellOrBuyForm>({
    mode: 'all',
    defaultValues: {
      amount: '' as any,
      total: '' as any,
    },
  });

  const sellForm = useForm<SellOrBuyForm>({
    mode: 'all',
    defaultValues: {
      amount: '' as any,
      total: '' as any,
    },
  });

  const handleTradeSideChange = (newTradeSide: TradeSideKey) => {
    if (newTradeSide === activeTradeSide) {
      return;
    }
    setActiveTradeSide(newTradeSide);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (
          !cleanTicker ||
          !simulationDate ||
          !simulationDateOnly ||
          !priceStartDateOnly ||
          !initialPriceFinishDateOnly
        ) {
          throw new Error('Simulation is not loaded');
        }

        const [stockResponse, detailsResponse, priceResponse] =
          await Promise.all([
            auth_fetch(apiUrl(`/api/stocks/${cleanTicker}`)),
            auth_fetch(apiUrl(`/api/stocks/${cleanTicker}/details`)),
            auth_fetch(
              apiUrl(
                `/api/stocks/${cleanTicker}/prices?start=${priceStartDateOnly}&finish=${initialPriceFinishDateOnly}&interval=1d`,
              ),
            ),
          ]);

        if (!stockResponse.ok) {
          throw new Error(`Status: ${stockResponse.status}`);
        }

        if (!detailsResponse.ok) {
          throw new Error(`Status: ${detailsResponse.status})`);
        }

        if (!priceResponse.ok) {
          throw new Error(`Status: ${priceResponse.status}`);
        }

        const [stockData, detailsData, priceRangeData]: [
          StockDto,
          StockDetailsDto,
          PriceDto[],
        ] = await Promise.all([
          stockResponse.json(),
          detailsResponse.json(),
          priceResponse.json(),
        ]);

        const mappedPrices = priceRangeData.map((priceDto) =>
          mapPriceDtoToPrice(priceDto),
        );

        olderPriceFetchKeyRef.current = null;
        isFetchingOlderPricesRef.current = false;
        futurePriceFetchKeyRef.current = null;
        isFetchingFuturePricesRef.current = false;

        setIsLoadingOlderPrices(false);
        setHasFetchedAllBack(mappedPrices.length === 0);
        setOldestFetchedDate(priceStartDateOnly);
        setNewestFetchedFinishDate(initialPriceFinishDateOnly);
        setStock(mapStockDtoToStock(stockData));
        setStockDetails(mapStockDetailsDtoToStockDetails(detailsData));
        setPriceRange(mappedPrices);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [cleanTicker, gameState.simulationId]);

  const loadOlderPricesFrom = useCallback(
    async (targetStartDate: string): Promise<void> => {
      if (
        !cleanTicker ||
        oldestFetchedDate === null ||
        hasFetchedAllBack ||
        targetStartDate >= oldestFetchedDate ||
        isFetchingOlderPricesRef.current
      ) {
        return;
      }

      const fetchKey = `${cleanTicker}:${targetStartDate}:${oldestFetchedDate}`;

      if (olderPriceFetchKeyRef.current === fetchKey) {
        return;
      }

      olderPriceFetchKeyRef.current = fetchKey;
      isFetchingOlderPricesRef.current = true;
      setIsLoadingOlderPrices(true);

      try {
        const response = await auth_fetch(
          apiUrl(
            `/api/stocks/${cleanTicker}/prices?start=${targetStartDate}&finish=${oldestFetchedDate}&interval=1d`,
          ),
        );

        if (!response.ok) {
          throw new Error(`Status: ${response.status}`);
        }

        const priceRangeData: PriceDto[] = await response.json();
        const olderPrices = priceRangeData.map((priceDto) =>
          mapPriceDtoToPrice(priceDto),
        );

        if (olderPrices.length === 0) {
          setOldestFetchedDate(targetStartDate);
          return;
        }

        setPriceRange((currentPrices) => {
          const mergedPrices = mergePriceRanges(
            currentPrices ?? [],
            olderPrices,
          );
          setOldestFetchedDate(targetStartDate);

          return mergedPrices;
        });
      } catch (err) {
        olderPriceFetchKeyRef.current = null;
        console.error(`Failed to load older prices for ${cleanTicker}`, err);
      } finally {
        isFetchingOlderPricesRef.current = false;
        setIsLoadingOlderPrices(false);
      }
    },
    [cleanTicker, hasFetchedAllBack, oldestFetchedDate],
  );

  const loadFuturePricesUntil = useCallback(
    async (targetFinishDate: string): Promise<void> => {
      if (
        !cleanTicker ||
        newestFetchedFinishDate === null ||
        targetFinishDate <= newestFetchedFinishDate ||
        isFetchingFuturePricesRef.current
      ) {
        return;
      }

      const fetchKey = `${cleanTicker}:${newestFetchedFinishDate}:${targetFinishDate}`;

      if (futurePriceFetchKeyRef.current === fetchKey) {
        return;
      }

      futurePriceFetchKeyRef.current = fetchKey;
      isFetchingFuturePricesRef.current = true;

      try {
        const response = await auth_fetch(
          apiUrl(
            `/api/stocks/${cleanTicker}/prices?start=${newestFetchedFinishDate}&finish=${targetFinishDate}&interval=1d`,
          ),
        );

        if (!response.ok) {
          throw new Error(`Status: ${response.status}`);
        }

        const priceRangeData: PriceDto[] = await response.json();
        const futurePrices = priceRangeData.map((priceDto) =>
          mapPriceDtoToPrice(priceDto),
        );

        setPriceRange((currentPrices) =>
          mergePriceRanges(currentPrices ?? [], futurePrices),
        );
        setNewestFetchedFinishDate(targetFinishDate);
      } catch (err) {
        futurePriceFetchKeyRef.current = null;
        console.error(`Failed to load future prices for ${cleanTicker}`, err);
      } finally {
        isFetchingFuturePricesRef.current = false;
      }
    },
    [cleanTicker, newestFetchedFinishDate],
  );

  useEffect(() => {
    if (simulationDateOnly === null || newestFetchedFinishDate === null) {
      return;
    }

    const fetchedThroughDate = addDaysToDateOnly(newestFetchedFinishDate, -1);
    const futureDaysLeft = getDateOnlyDayDiff(
      simulationDateOnly,
      fetchedThroughDate,
    );

    const targetFinishDate =
      futureDaysLeft < 0
        ? getCappedFetchFinishDate(
            addDaysToDateOnly(simulationDateOnly, INITIAL_FUTURE_DAYS + 1),
            simulationFinishDateOnly,
          )
        : getCappedFetchFinishDate(
            addMonthsToDateOnly(newestFetchedFinishDate, FUTURE_FETCH_MONTHS),
            simulationFinishDateOnly,
          );

    if (
      futureDaysLeft > FUTURE_FETCH_THRESHOLD_DAYS ||
      targetFinishDate <= newestFetchedFinishDate
    ) {
      return;
    }

    void loadFuturePricesUntil(targetFinishDate);
  }, [
    loadFuturePricesUntil,
    newestFetchedFinishDate,
    simulationDateOnly,
    simulationFinishDateOnly,
  ]);

  const loadAllPrices = useCallback(async (): Promise<boolean> => {
    if (
      !cleanTicker ||
      priceFinishDateOnly === null ||
      isFetchingOlderPricesRef.current
    ) {
      return false;
    }

    if (hasFetchedAllBack) {
      return true;
    }

    const fetchKey = `${cleanTicker}:all:${priceFinishDateOnly}`;

    if (olderPriceFetchKeyRef.current === fetchKey) {
      return false;
    }

    olderPriceFetchKeyRef.current = fetchKey;
    isFetchingOlderPricesRef.current = true;
    setIsLoadingOlderPrices(true);

    try {
      const response = await auth_fetch(
        apiUrl(
          `/api/stocks/${cleanTicker}/prices?finish=${priceFinishDateOnly}&interval=1d`,
        ),
      );

      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }

      const priceRangeData: PriceDto[] = await response.json();
      const allPrices = priceRangeData.map((priceDto) =>
        mapPriceDtoToPrice(priceDto),
      );

      setPriceRange((currentPrices) => {
        const mergedPrices = mergePriceRanges(currentPrices ?? [], allPrices);
        setOldestFetchedDate(getOldestPriceDate(mergedPrices));

        return mergedPrices;
      });
      setHasFetchedAllBack(true);
      return true;
    } catch (err) {
      olderPriceFetchKeyRef.current = null;
      console.error(`Failed to load all prices for ${cleanTicker}`, err);
      return false;
    } finally {
      isFetchingOlderPricesRef.current = false;
      setIsLoadingOlderPrices(false);
    }
  }, [cleanTicker, hasFetchedAllBack, priceFinishDateOnly]);

  const handlePeriodChange = async (newPeriod: PeriodKey) => {
    if (newPeriod === activePeriod) {
      return;
    }

    if (newPeriod === PeriodKey.ALL) {
      const hasLoadedAllPrices = await loadAllPrices();

      if (hasLoadedAllPrices) {
        setActivePeriod(newPeriod);
      }

      return;
    }

    const targetStartDate =
      simulationDateOnly !== null
        ? getPeriodStartDate(periods[newPeriod], simulationDateOnly)
        : null;

    if (targetStartDate !== null) {
      await loadOlderPricesFrom(targetStartDate);
    }

    setActivePeriod(newPeriod);
  };

  const handleChartVisibleRangeChange = useCallback(
    ({
      from,
      to,
      barsBefore,
    }: {
      from: string | null;
      to: string | null;
      barsBefore: number | null;
    }) => {
      const isAtLoadedLeftEdge = barsBefore !== null && barsBefore <= 2;

      if (
        from === null ||
        to === null ||
        oldestFetchedDate === null ||
        hasFetchedAllBack ||
        (!isAtLoadedLeftEdge && from >= oldestFetchedDate)
      ) {
        return;
      }

      const visibleIntervalMonths = getVisibleIntervalMonths(from, to);
      const fetchMonths = visibleIntervalMonths * DRAG_FETCH_MULTIPLIER;
      const bufferedStartDate = addMonthsToDateOnly(
        oldestFetchedDate,
        -fetchMonths,
      );

      void loadOlderPricesFrom(bufferedStartDate);
    },
    [hasFetchedAllBack, loadOlderPricesFrom, oldestFetchedDate],
  );

  const currentPrice = currentPosition?.currentPrice ?? 0;
  const priceChange = currentPosition?.priceChange ?? 0;
  const priceChangePercent = currentPosition?.priceChangePercent ?? 0;
  const ownedShares = currentPosition?.amount ?? 0;
  const ownedPositionValue = ownedShares * currentPrice;
  const formattedOwnedShares = ownedShares.toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
  const formattedOwnedPositionValue = ownedPositionValue.toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );

  const visiblePriceRange = useMemo(() => {
    if (!priceRange || simulationDateOnly === null) {
      return [];
    }

    return priceRange
      .filter((price) => {
        const priceDate = toDateOnly(price.priceDate);
        return priceDate !== null && priceDate <= simulationDateOnly;
      })
      .map((price) => {
        const priceDate = toDateOnly(price.priceDate);

        if (priceDate !== simulationDateOnly) {
          return price;
        }

        return {
          ...price,
          high: price.open,
          low: price.open,
          close: price.open,
        };
      });
  }, [priceRange, simulationDateOnly]);

  const buyAmount = buyForm.watch('amount');
  const buyTotal = buyForm.watch('total');

  useEffect(() => {
    if (!currentPrice) return;

    const { errors } = buyForm.formState;
    const activeName = document.activeElement?.getAttribute('name');

    if (activeName === 'buy-amount') {
      console.log('buy amount changed', buyAmount);
      if (Number.isNaN(buyAmount) || Number(buyAmount) < 1) {
        buyForm.setValue('total', '' as any);
        return;
      }
      const newTotal = Number(buyAmount) * currentPrice;
      if (Number(buyTotal) !== newTotal) {
        buyForm.setValue('total', newTotal);
        return;
      }
    } else if (activeName === 'buy-total') {
      if (Number.isNaN(buyTotal) || Number(buyTotal) < 1) {
        buyForm.setValue('amount', '' as any);
        return;
      }
      const newAmount = Number((Number(buyTotal) / currentPrice).toFixed(6));
      if (Number(buyAmount) !== newAmount) {
        buyForm.setValue('amount', newAmount, { shouldValidate: true });
        return;
      }
    } else {
      // if (Number(buyAmount) < 1) return;
      // const newTotal = Number(buyAmount) * currentPrice;
      // if (Number(buyTotal) !== newTotal) {
      //   buyForm.setValue('total', newTotal);
      // }
    }
  }, [buyAmount, buyTotal, buyForm, currentPrice]);

  const sellAmount = sellForm.watch('amount');
  const sellTotal = sellForm.watch('total');

  useEffect(() => {
    if (!currentPrice) return;

    const { errors } = sellForm.formState;
    const activeName = document.activeElement?.getAttribute('name');

    if (activeName === 'sell-amount') {
      if (Number.isNaN(sellAmount) || Number(sellAmount) < 1) {
        sellForm.setValue('total', '' as any);
        return;
      }
      const newTotal = Number(sellAmount) * currentPrice;
      if (Number(sellTotal) !== newTotal) {
        sellForm.setValue('total', newTotal);
        return;
      }
    } else if (activeName === 'sell-total') {
      if (Number.isNaN(sellTotal) || Number(sellTotal) < 1) {
        sellForm.setValue('amount', '' as any);
        return;
      }
      const newAmount = Number((Number(sellTotal) / currentPrice).toFixed(6));
      if (Number(sellAmount) !== newAmount) {
        sellForm.setValue('amount', newAmount, { shouldValidate: true });
      }
    } else {
      // if (Number(sellAmount) < 1) return;
      // const newTotal = Number(sellAmount) * currentPrice;
      // if (Number(sellTotal) !== newTotal) {
      //   sellForm.setValue('total', newTotal);
      // }
    }
  }, [sellAmount, sellTotal, sellForm, currentPrice]);

  const onBuySubmit = async (data: SellOrBuyForm) => {
    if (!stock || !simulationDate) {
      return;
    }

    await makeTransaction({
      stockId: stock.stockId,
      transactionType: 'buy',
      transactionTime: simulationDate,
      price: currentPrice,
      amount: data.amount,
    });
  };

  const onSellSubmit = async (data: SellOrBuyForm) => {
    if (!stock || !simulationDate) {
      return;
    }

    await makeTransaction({
      stockId: stock.stockId,
      transactionType: 'sell',
      transactionTime: simulationDate,
      price: currentPrice,
      amount: data.amount,
    });
  };

  if (loading) {
    return (
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <CustomLoading />
      </div>
    );
  }

  if (error || !stock || !stockDetails || !priceRange) {
    return (
      <InfoModal
        open={true}
        title="Error"
        bodyText="Could not find this stock. You will be redirected to the home page."
        btnText="Close"
        onClose={() => navigate('/')}
        onConfirm={() => navigate('/')}
      />
    );
  }

  return (
    <div
      className="container px-4 py-4 pb-4 my-3 border shadow-sm rounded-3"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        // overflow: 'hidden',
      }}
    >
      <MDBContainer
        className="gap-3 d-flex flex-column"
        style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}
      >
        <div className="border-bottom">
          <MDBRow className="align-items-center justify-content-between ">
            <MDBCol size="auto" className="mb-3">
              <MDBRow className="align-items-center g-2">
                <MDBCol size="auto">
                  <div className="d-flex align-items-center">
                    {/* <button
                      className="p-0 m-0 border-0 btn me-4"
                      onClick={() => navigate(-1)}
                      aria-label="Go back"
                    >
                      <MDBTypography tag="h4" className="m-0 fw-semibold">
                        ←
                      </MDBTypography>
                    </button>

                    <div
                      aria-hidden="true"
                      className="vr me-3 align-self-stretch"
                      style={{ opacity: 0.08 }}
                    /> */}

                    <div className="d-flex flex-column">
                      <button
                        className="p-0 m-0 border-0 shadow-none btn text-start"
                        onClick={() => setIsCompanyDetailsOpen(true)}
                      >
                        <MDBTypography tag="h3" className="m-0 fw-bold">
                          {stock.ticker}
                        </MDBTypography>
                      </button>

                      <MDBTypography
                        tag="h6"
                        className="m-0 mt-1 shadow-none opacity-50"
                        style={{ maxWidth: '100%', overflowWrap: 'anywhere' }}
                      >
                        {stock.companyName}
                      </MDBTypography>

                      <MDBTypography
                        tag="p"
                        className="m-0 mt-2 small text-muted"
                      >
                        <span style={{ opacity: 0.75 }}>{stock.sector}</span>
                        <span className="mx-2" style={{ opacity: 0.45 }}>
                          •
                        </span>
                        <span style={{ opacity: 0.75 }}>{stock.industry}</span>
                      </MDBTypography>
                    </div>
                  </div>
                </MDBCol>
              </MDBRow>
            </MDBCol>

            <MDBCol size="auto" className="text-end mb-2">
              <MDBRow className="align-items-center justify-content-end g-2">
                <MDBCol size="auto">
                  <MDBTypography tag="p" className="m-0 fs-5 fw-semibold">
                    {currentPrice.toFixed(2)} {stockDetails.currency}
                  </MDBTypography>
                </MDBCol>

                <MDBCol size="auto">
                  <MDBTypography
                    tag="p"
                    className={`m-0 fs-6 ${priceChange >= 0 ? 'text-price-up' : 'text-price-down'}`}
                  >
                    {priceChange >= 0 ? '+' : '-'}
                    {Math.abs(priceChange).toFixed(2)}
                  </MDBTypography>
                </MDBCol>
                <MDBCol size="auto">
                  <MDBTypography
                    tag="p"
                    className={`m-0 fs-6 ${priceChange >= 0 ? 'text-price-up' : 'text-price-down'}`}
                  >
                    ({Math.abs(priceChangePercent).toFixed(2)}%)
                  </MDBTypography>
                </MDBCol>
              </MDBRow>

              <MDBTypography tag="p" className="m-0 mt-2 small text-muted">
                Owned: {formattedOwnedShares} shares (
                {formattedOwnedPositionValue} {stockDetails.currency})
              </MDBTypography>
            </MDBCol>
          </MDBRow>
        </div>

        <MDBRow
          className="justify-content-between g-3"
          style={{ flex: 1, minHeight: 0 }}
        >
          <MDBCol
            size="12"
            lg="9"
            style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            <div
              className="gap-2 d-flex flex-column"
              style={{ flex: 1, minHeight: 0 }}
            >
              <div
                className="p-3 border shadow-sm rounded-3"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  position: 'relative',
                }}
              >
                <TradingChart
                  style={{ flex: 1, minHeight: 0 }}
                  priceRange={visiblePriceRange}
                  period={periods[activePeriod]}
                  isLoading={isLoadingOlderPrices}
                  onVisibleRangeChange={handleChartVisibleRangeChange}
                />
                {isLoadingOlderPrices && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      pointerEvents: 'auto',
                      zIndex: 1,
                    }}
                  >
                    <CustomLoading />
                  </div>
                )}
              </div>
              <div className="p-1 border shadow-sm rounded-3">
                <MDBRow className="align-items-center justify-content-between g-3">
                  <MDBCol size="auto">
                    <MDBTabs pills fill>
                      <MDBTabsItem>
                        <MDBTabsLink
                          className="px-3 py-2"
                          onClick={() => handlePeriodChange(PeriodKey.M1)}
                          active={activePeriod === PeriodKey.M1}
                        >
                          <MDBTypography
                            tag="h6"
                            className="m-0 fw-semibold lh-1"
                          >
                            {PeriodKey.M1}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink
                          className="px-3 py-2"
                          onClick={() => handlePeriodChange(PeriodKey.M3)}
                          active={activePeriod === PeriodKey.M3}
                        >
                          <MDBTypography
                            tag="h6"
                            className="m-0 fw-semibold lh-1"
                          >
                            {PeriodKey.M3}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink
                          className="px-3 py-2"
                          onClick={() => handlePeriodChange(PeriodKey.M6)}
                          active={activePeriod === PeriodKey.M6}
                        >
                          <MDBTypography
                            tag="h6"
                            className="m-0 fw-semibold lh-1"
                          >
                            {PeriodKey.M6}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink
                          className="px-3 py-2"
                          onClick={() => handlePeriodChange(PeriodKey.Y1)}
                          active={activePeriod === PeriodKey.Y1}
                        >
                          <MDBTypography
                            tag="h6"
                            className="m-0 fw-semibold lh-1"
                          >
                            {PeriodKey.Y1}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink
                          className="px-3 py-2"
                          onClick={() => handlePeriodChange(PeriodKey.Y5)}
                          active={activePeriod === PeriodKey.Y5}
                        >
                          <MDBTypography
                            tag="h6"
                            className="m-0 fw-semibold lh-1"
                          >
                            {PeriodKey.Y5}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink
                          className="px-3 py-2"
                          onClick={() => handlePeriodChange(PeriodKey.ALL)}
                          active={activePeriod === PeriodKey.ALL}
                        >
                          <MDBTypography
                            tag="h6"
                            className="m-0 fw-semibold lh-1"
                          >
                            All
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                    </MDBTabs>
                  </MDBCol>
                  <MDBCol size="auto" className="d-flex">
                    <MDBTypography
                      tag="h6"
                      className="m-0 fw-semibold lh-1"
                    ></MDBTypography>
                  </MDBCol>
                </MDBRow>
              </div>
            </div>
          </MDBCol>

          <MDBCol size="12" lg="3">
            <div className="p-3 border shadow-sm h-100 rounded-3">
              <div className="h-auto gap-3 d-flex flex-column justify-content-start">
                <div className="pb-3 border-bottom">
                  <MDBTabs pills fill>
                    <MDBTabsItem>
                      <MDBTabsLink
                        className="px-3 py-2"
                        onClick={() => handleTradeSideChange(TradeSideKey.Buy)}
                        active={activeTradeSide === TradeSideKey.Buy}
                      >
                        <MDBTypography
                          tag="p"
                          className="m-0 fs-6 fw-semibold lh-1 "
                        >
                          Buy
                        </MDBTypography>
                      </MDBTabsLink>
                    </MDBTabsItem>
                    <MDBTabsItem>
                      <MDBTabsLink
                        className="px-3 py-2"
                        onClick={() => handleTradeSideChange(TradeSideKey.Sell)}
                        active={activeTradeSide === TradeSideKey.Sell}
                      >
                        <MDBTypography
                          tag="p"
                          className="m-0 fs-6 fw-semibold lh-1"
                          style={{ fontSize: '16px' }}
                        >
                          Sell
                        </MDBTypography>
                      </MDBTabsLink>
                    </MDBTabsItem>
                  </MDBTabs>
                </div>
                <form
                  style={{
                    display:
                      activeTradeSide === TradeSideKey.Buy
                        ? 'contents'
                        : 'none',
                  }}
                >
                  <Controller
                    name="amount"
                    control={buyForm.control}
                    rules={{
                      required: 'Amount is required',
                      min: { value: 1, message: 'Amount must be positive' },
                      validate: (value) => {
                        if (Number.isNaN(value)) {
                          return 'Amount must be a number';
                        }
                        if (
                          value * currentPrice >
                          (gameState.availableFunds ?? 0)
                        ) {
                          return 'Not enough funds';
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <AmountInput
                        {...field}
                        name="buy-amount"
                        iconSrc={stockImg}
                        label="You buy"
                        placeholder="0"
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === 'e')
                            e.preventDefault();
                        }}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val < 1) e.target.value = '';
                          field.onChange(e);
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="total"
                    control={buyForm.control}
                    render={({ field }) => (
                      <AmountInput
                        {...field}
                        name="buy-total"
                        iconSrc={moneyImg}
                        label="You spend"
                        placeholder="0.00"
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === 'e')
                            e.preventDefault();
                        }}
                      />
                    )}
                  />
                  <MDBBtn
                    onClick={buyForm.handleSubmit(onBuySubmit)}
                    className="p-3 bg-white w-100 rounded-3"
                    disabled={
                      !buyForm.formState.isValid ||
                      (gameState.availableFunds ?? 0) <= 0
                    }
                  >
                    <MDBTypography tag="h6" className="m-0 fw-semibold lh-1">
                      Buy
                    </MDBTypography>
                  </MDBBtn>
                </form>
                <form
                  style={{
                    display:
                      activeTradeSide === TradeSideKey.Sell
                        ? 'contents'
                        : 'none',
                  }}
                >
                  <Controller
                    name="amount"
                    control={sellForm.control}
                    rules={{
                      required: 'Amount is required',
                      min: { value: 1, message: 'Amount must be positive' },
                      validate: (value) => {
                        if (Number.isNaN(value)) {
                          return 'Amount must be a number';
                        }
                        if (value > (currentPosition?.amount ?? 0)) {
                          return 'Not enough shares to sell';
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <AmountInput
                        {...field}
                        name="sell-amount"
                        iconSrc={stockImg}
                        label="You sell"
                        placeholder="0"
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === 'e')
                            e.preventDefault();
                        }}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val < 1) e.target.value = '';
                          field.onChange(e);
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="total"
                    control={sellForm.control}
                    render={({ field }) => (
                      <AmountInput
                        {...field}
                        name="sell-total"
                        iconSrc={moneyImg}
                        label="You receive"
                        placeholder="0.00"
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === 'e')
                            e.preventDefault();
                        }}
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={sellForm.handleSubmit(onSellSubmit)}
                    className="p-3 bg-white btn btn-primary w-100 rounded-3"
                    disabled={
                      !sellForm.formState.isValid ||
                      !currentPosition ||
                      currentPosition.amount === 0
                    }
                  >
                    <MDBTypography tag="h6" className="m-0 fw-semibold lh-1">
                      Sell
                    </MDBTypography>
                  </button>
                </form>
              </div>
            </div>
          </MDBCol>
        </MDBRow>
      </MDBContainer>

      <CompanyDetailsModal
        isOpen={isCompanyDetailsOpen}
        onClose={() => setIsCompanyDetailsOpen(false)}
        stock={stock}
        stockDetails={stockDetails}
        price={currentPrice}
        change={priceChange}
        changePercent={priceChangePercent}
      />
    </div>
  );
}

export default TradingViewPage;
