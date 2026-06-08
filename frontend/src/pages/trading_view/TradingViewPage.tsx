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
import { useEffect, useMemo, useRef, useState } from 'react';
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
  calculatePriceMetrics,
  toDateOnly,
} from '../../utils';
import { useGame } from '../../contexts/GameContext';
import { CustomLoading } from '../../components/Common/CustomLoading';

enum TradeSideKey {
  Buy = 'buy',
  Sell = 'sell',
}

enum PeriodKey {
  D1 = 'D1',
  D3 = 'D3',
  M1 = 'M1',
  M3 = 'M3',
  M6 = 'M6',
  Y1 = 'Y1',
  ALL = 'ALL',
}

const periods: Record<PeriodKey, TradingChartPeriod> = {
  [PeriodKey.D1]: { amount: 1, unit: TimeUnit.Day },
  [PeriodKey.D3]: { amount: 3, unit: TimeUnit.Day },
  [PeriodKey.M1]: { amount: 1, unit: TimeUnit.Month },
  [PeriodKey.M3]: { amount: 3, unit: TimeUnit.Month },
  [PeriodKey.M6]: { amount: 6, unit: TimeUnit.Month },
  [PeriodKey.Y1]: { amount: 1, unit: TimeUnit.Year },
  [PeriodKey.ALL]: { amount: 0, unit: TimeUnit.All },
};

interface SellOrBuyForm {
  amount: number;
  total: number;
}

const getOldestPriceDate = (prices: Price[]): string | null => {
  if (prices.length === 0) {
    return null;
  }

  return prices.reduce<string | null>((oldestDate, price) => {
    const priceDate = toDateOnly(price.priceDate);

    if (priceDate === null) {
      return oldestDate;
    }

    return oldestDate === null || priceDate < oldestDate
      ? priceDate
      : oldestDate;
  }, null);
};

const getNewestPriceDate = (prices: Price[]): string | null => {
  if (prices.length === 0) {
    return null;
  }

  return prices.reduce<string | null>((newestDate, price) => {
    const priceDate = toDateOnly(price.priceDate);

    if (priceDate === null) {
      return newestDate;
    }

    return newestDate === null || priceDate > newestDate
      ? priceDate
      : newestDate;
  }, null);
};

const minDateOnly = (left: string, right: string) =>
  left <= right ? left : right;

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

export function TradingViewPage() {
  // prettier-ignore
  const [activeTradeSide, setActiveTradeSide] = useState<TradeSideKey>(TradeSideKey.Buy,);
  const [activePeriod, setActivePeriod] = useState<PeriodKey>(PeriodKey.M1);
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
  const [oldestFetchedDate, setOldestFetchedDate] = useState<string | null>(
    null,
  );
  const [newestFetchedDate, setNewestFetchedDate] = useState<string | null>(
    null,
  );
  const [hasFetchedAllBack, setHasFetchedAllBack] = useState(false);
  const [hasFetchedAllAhead, setHasFetchedAllAhead] = useState(false);
  const isFetchingOlderPricesRef = useRef(false);
  const isFetchingFuturePricesRef = useRef(false);
  const olderPriceFetchKeyRef = useRef<string | null>(null);
  const futurePriceFetchKeyRef = useRef<string | null>(null);

  const simulationDate = gameState.currentDate ?? gameState.startDate;
  const simulationDateOnly = toDateOnly(simulationDate);
  const finishDateOnly = toDateOnly(gameState.finishDate);
  const priceStartDateOnly = simulationDateOnly
    ? addMonthsToDateOnly(simulationDateOnly, -2)
    : null;
  const priceFinishDateOnly = useMemo(() => {
    if (simulationDateOnly === null) {
      return null;
    }

    const futureTradingDates = gameState.tradingDates.filter(
      (tradingDate) => tradingDate > simulationDateOnly,
    );
    const targetDate =
      futureTradingDates[4] ??
      futureTradingDates[futureTradingDates.length - 1] ??
      simulationDateOnly;

    return addDaysToDateOnly(targetDate, 1);
  }, [gameState.tradingDates, simulationDateOnly]);

  const buyForm = useForm<SellOrBuyForm>({
    defaultValues: {
      amount: NaN,
      total: NaN,
    },
  });

  const sellForm = useForm<SellOrBuyForm>({
    defaultValues: {
      amount: NaN,
      total: NaN,
    },
  });

  const handleTradeSideChange = (newTradeSide: TradeSideKey) => {
    if (newTradeSide === activeTradeSide) {
      return;
    }
    setActiveTradeSide(newTradeSide);
  };

  const handlePeriodChange = (newPeriod: PeriodKey) => {
    if (newPeriod === activePeriod) {
      return;
    }
    setActivePeriod(newPeriod);
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
          !priceFinishDateOnly
        ) {
          throw new Error('Simulation is not loaded');
        }

        const [stockResponse, detailsResponse, priceResponse] =
          await Promise.all([
            fetch(apiUrl(`/api/stocks/${cleanTicker}`)),
            fetch(apiUrl(`/api/stocks/${cleanTicker}/details`)),
            fetch(
              apiUrl(
                `/api/stocks/${cleanTicker}/prices?start=${priceStartDateOnly}&finish=${priceFinishDateOnly}&interval=1d`,
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
        const newestPriceDate = getNewestPriceDate(mappedPrices);

        olderPriceFetchKeyRef.current = null;
        futurePriceFetchKeyRef.current = null;
        isFetchingOlderPricesRef.current = false;
        isFetchingFuturePricesRef.current = false;
        setHasFetchedAllBack(mappedPrices.length === 0);
        setHasFetchedAllAhead(
          newestPriceDate === null ||
            finishDateOnly === null ||
            newestPriceDate >= finishDateOnly,
        );
        setOldestFetchedDate(getOldestPriceDate(mappedPrices));
        setNewestFetchedDate(newestPriceDate);
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

  useEffect(() => {
    if (
      !cleanTicker ||
      oldestFetchedDate === null ||
      hasFetchedAllBack ||
      isFetchingOlderPricesRef.current
    ) {
      return;
    }

    const fetchKey = `${cleanTicker}:${oldestFetchedDate}`;

    if (olderPriceFetchKeyRef.current === fetchKey) {
      return;
    }

    let isCancelled = false;
    olderPriceFetchKeyRef.current = fetchKey;
    isFetchingOlderPricesRef.current = true;

    const loadOlderPrices = async () => {
      try {
        const nextStartDate = addMonthsToDateOnly(oldestFetchedDate, -2);
        const response = await fetch(
          apiUrl(
            `/api/stocks/${cleanTicker}/prices?start=${nextStartDate}&finish=${oldestFetchedDate}&interval=1d`,
          ),
        );

        if (!response.ok) {
          throw new Error(`Status: ${response.status}`);
        }

        const priceRangeData: PriceDto[] = await response.json();
        const olderPrices = priceRangeData.map((priceDto) =>
          mapPriceDtoToPrice(priceDto),
        );

        if (isCancelled) {
          return;
        }

        if (olderPrices.length === 0) {
          setHasFetchedAllBack(true);
          return;
        }

        setPriceRange((currentPrices) => {
          const mergedPrices = mergePriceRanges(
            currentPrices ?? [],
            olderPrices,
          );
          const nextOldestDate = getOldestPriceDate(mergedPrices);

          if (nextOldestDate === oldestFetchedDate) {
            setHasFetchedAllBack(true);
          } else {
            setOldestFetchedDate(nextOldestDate);
          }

          return mergedPrices;
        });
      } catch (err) {
        console.error(`Failed to load older prices for ${cleanTicker}`, err);

        if (!isCancelled) {
          setHasFetchedAllBack(true);
        }
      } finally {
        if (!isCancelled) {
          isFetchingOlderPricesRef.current = false;
        }
      }
    };

    loadOlderPrices();

    return () => {
      isCancelled = true;
    };
  }, [cleanTicker, hasFetchedAllBack, oldestFetchedDate]);

  useEffect(() => {
    if (
      !cleanTicker ||
      newestFetchedDate === null ||
      finishDateOnly === null ||
      hasFetchedAllAhead ||
      isFetchingFuturePricesRef.current
    ) {
      return;
    }

    if (newestFetchedDate >= finishDateOnly) {
      setHasFetchedAllAhead(true);
      return;
    }

    const finishBoundaryDate = addDaysToDateOnly(finishDateOnly, 1);
    const nextFinishDate = minDateOnly(
      addMonthsToDateOnly(newestFetchedDate, 2),
      finishBoundaryDate,
    );
    const fetchKey = `${cleanTicker}:${newestFetchedDate}:${nextFinishDate}`;

    if (futurePriceFetchKeyRef.current === fetchKey) {
      return;
    }

    let isCancelled = false;
    futurePriceFetchKeyRef.current = fetchKey;
    isFetchingFuturePricesRef.current = true;

    const loadFuturePrices = async () => {
      try {
        const response = await fetch(
          apiUrl(
            `/api/stocks/${cleanTicker}/prices?start=${newestFetchedDate}&finish=${nextFinishDate}&interval=1d`,
          ),
        );

        if (!response.ok) {
          throw new Error(`Status: ${response.status}`);
        }

        const priceRangeData: PriceDto[] = await response.json();
        const futurePrices = priceRangeData.map((priceDto) =>
          mapPriceDtoToPrice(priceDto),
        );

        if (isCancelled) {
          return;
        }

        if (futurePrices.length === 0) {
          if (nextFinishDate >= finishBoundaryDate) {
            setHasFetchedAllAhead(true);
          } else {
            setNewestFetchedDate(addDaysToDateOnly(nextFinishDate, -1));
          }

          return;
        }

        setPriceRange((currentPrices) => {
          const mergedPrices = mergePriceRanges(
            currentPrices ?? [],
            futurePrices,
          );
          const nextNewestDate = getNewestPriceDate(mergedPrices);

          if (nextNewestDate === null || nextNewestDate >= finishDateOnly) {
            setHasFetchedAllAhead(true);
          } else if (nextNewestDate === newestFetchedDate) {
            setNewestFetchedDate(addDaysToDateOnly(nextFinishDate, -1));
          } else {
            setNewestFetchedDate(nextNewestDate);
          }

          return mergedPrices;
        });
      } catch (err) {
        console.error(`Failed to load future prices for ${cleanTicker}`, err);

        if (!isCancelled) {
          setHasFetchedAllAhead(true);
        }
      } finally {
        if (!isCancelled) {
          isFetchingFuturePricesRef.current = false;
        }
      }
    };

    loadFuturePrices();

    return () => {
      isCancelled = true;
    };
  }, [cleanTicker, finishDateOnly, hasFetchedAllAhead, newestFetchedDate]);

  const currentPriceIndex = useMemo(() => {
    if (!priceRange || priceRange.length === 0) {
      return -1;
    }

    const exactIndex = priceRange.findIndex(
      (price) => toDateOnly(price.priceDate) === simulationDateOnly,
    );

    if (exactIndex >= 0) {
      return exactIndex;
    }

    for (let index = priceRange.length - 1; index >= 0; index -= 1) {
      const priceDate = toDateOnly(priceRange[index].priceDate);

      if (
        priceDate !== null &&
        simulationDateOnly !== null &&
        priceDate <= simulationDateOnly
      ) {
        return index;
      }
    }

    return -1;
  }, [priceRange, simulationDateOnly]);

  const todayPrice: number =
    priceRange && currentPriceIndex >= 0
      ? priceRange[currentPriceIndex].open
      : 0;
  const yesterdayPrice =
    priceRange && currentPriceIndex > 0
      ? priceRange[currentPriceIndex - 1].open
      : undefined;

  const { currentPrice, priceChange, priceChangePercent } =
    calculatePriceMetrics(todayPrice, yesterdayPrice);

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

    const activeName = document.activeElement?.getAttribute('name');

    if (activeName === 'buy-amount') {
      const newTotal = Number(buyAmount) * currentPrice;
      if (Number(buyTotal) !== newTotal) {
        buyForm.setValue('total', newTotal);
      }
    } else if (activeName === 'buy-total') {
      const newAmount = Number((Number(buyTotal) / currentPrice).toFixed(6));
      if (Number(buyAmount) !== newAmount) {
        buyForm.setValue('amount', newAmount);
      }
    }
  }, [buyAmount, buyTotal, buyForm.setValue]);

  const sellAmount = sellForm.watch('amount');
  const sellTotal = sellForm.watch('total');

  useEffect(() => {
    if (!currentPrice) return;

    const activeName = document.activeElement?.getAttribute('name');

    if (activeName === 'sell-amount') {
      const newTotal = Number(sellAmount) * currentPrice;
      if (Number(sellTotal) !== newTotal) {
        sellForm.setValue('total', newTotal);
      }
    } else if (activeName === 'sell-total') {
      const newAmount = Number((Number(sellTotal) / currentPrice).toFixed(6));
      if (Number(sellAmount) !== newAmount) {
        sellForm.setValue('amount', newAmount);
      }
    }
  }, [sellAmount, sellTotal, sellForm.setValue]);

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
    <div className="container px-4 py-4 pb-4 my-3 border rounded-3 shadow-sm">
      <MDBContainer className="d-flex flex-column gap-3">
        <div className="border-bottom">
          <MDBRow className="align-items-center justify-content-between ">
            <MDBCol size="auto" className="mb-3">
              <MDBRow className="align-items-center g-2">
                <MDBCol size="auto">
                  <div className="d-flex align-items-center">
                    <button
                      className="btn p-0 m-0 border-0 me-4"
                      onClick={() => navigate(-1)}
                      aria-label="Go back"
                    >
                      <MDBTypography tag="h2" className="m-0 fw-semibold">
                        ←
                      </MDBTypography>
                    </button>

                    <div
                      aria-hidden="true"
                      className="vr me-3 align-self-stretch"
                      style={{ opacity: 0.08 }}
                    />

                    <div className="d-flex flex-column">
                      <button
                        className="btn p-0 m-0 border-0 text-start"
                        onClick={() => setIsCompanyDetailsOpen(true)}
                      >
                        <MDBTypography tag="h2" className="fw-bold m-0">
                          {stock.ticker}
                        </MDBTypography>
                      </button>

                      <MDBTypography
                        tag="h5"
                        className="opacity-50 m-0 mt-1"
                        style={{ maxWidth: '100%', overflowWrap: 'anywhere' }}
                      >
                        {stock.companyName}
                      </MDBTypography>

                      <MDBTypography
                        tag="p"
                        className="small text-muted mt-2 m-0"
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

            <MDBCol size="auto">
              <MDBRow className="align-items-center g-2">
                <MDBCol size="auto">
                  <MDBTypography tag="p" className={`fs-5 fw-semibold`}>
                    {currentPrice.toFixed(2)} {stockDetails.currency}
                  </MDBTypography>
                </MDBCol>

                <MDBCol size="auto">
                  <MDBTypography
                    tag="p"
                    className={`fs-6 ${priceChange >= 0 ? 'text-price-up' : 'text-price-down'}`}
                  >
                    {priceChange >= 0 ? '+' : '-'}
                    {Math.abs(priceChange).toFixed(2)}
                  </MDBTypography>
                </MDBCol>
                <MDBCol size="auto">
                  <MDBTypography
                    tag="p"
                    className={`fs-6 ${priceChange >= 0 ? 'text-price-up' : 'text-price-down'}`}
                  >
                    ({Math.abs(priceChangePercent).toFixed(2)}%)
                  </MDBTypography>
                </MDBCol>
              </MDBRow>
            </MDBCol>
          </MDBRow>
        </div>

        <MDBRow className="justify-content-between g-3">
          <MDBCol size="12" lg="9">
            <div className="d-flex flex-column gap-2">
              <div className="border rounded-3 shadow-sm p-3">
                <TradingChart
                  style={{ height: '70vh' }}
                  priceRange={visiblePriceRange}
                  period={periods[activePeriod]}
                />
              </div>
              <div className="border rounded-3 shadow-sm p-1">
                <MDBRow className="align-items-center justify-content-between  g-3">
                  <MDBCol size="auto">
                    <MDBTabs pills fill>
                      <MDBTabsItem>
                        <MDBTabsLink
                          className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.D1)}
                          active={activePeriod === PeriodKey.D1}
                        >
                          <MDBTypography
                            tag="h6"
                            className="fw-semibold m-0 lh-1"
                          >
                            {PeriodKey.D1}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink
                          className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.D3)}
                          active={activePeriod === PeriodKey.D3}
                        >
                          <MDBTypography
                            tag="h6"
                            className="fw-semibold m-0 lh-1"
                          >
                            {PeriodKey.D3}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink
                          className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.M1)}
                          active={activePeriod === PeriodKey.M1}
                        >
                          <MDBTypography
                            tag="h6"
                            className="fw-semibold m-0 lh-1"
                          >
                            {PeriodKey.M1}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink
                          className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.M3)}
                          active={activePeriod === PeriodKey.M3}
                        >
                          <MDBTypography
                            tag="h6"
                            className="fw-semibold m-0 lh-1"
                          >
                            {PeriodKey.M3}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink
                          className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.M6)}
                          active={activePeriod === PeriodKey.M6}
                        >
                          <MDBTypography
                            tag="h6"
                            className="fw-semibold m-0 lh-1"
                          >
                            {PeriodKey.M6}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink
                          className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.Y1)}
                          active={activePeriod === PeriodKey.Y1}
                        >
                          <MDBTypography
                            tag="h6"
                            className="fw-semibold m-0 lh-1"
                          >
                            {PeriodKey.Y1}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink
                          className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.ALL)}
                          active={activePeriod === PeriodKey.ALL}
                        >
                          <MDBTypography
                            tag="h6"
                            className="fw-semibold m-0 lh-1"
                          >
                            All
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                    </MDBTabs>
                  </MDBCol>
                  <MDBCol fill size="auto" className="d-flex">
                    <MDBTypography
                      tag="h6"
                      className="fw-semibold m-0 lh-1"
                    ></MDBTypography>
                  </MDBCol>
                </MDBRow>
              </div>
            </div>
          </MDBCol>

          <MDBCol size="12" lg="3">
            <div className="h-100 border rounded-3 shadow-sm p-3">
              <div className="h-auto d-flex flex-column justify-content-start gap-3">
                <div className="border-bottom pb-3">
                  <MDBTabs pills fill>
                    <MDBTabsItem>
                      <MDBTabsLink
                        className="py-2 px-3"
                        onClick={() => handleTradeSideChange(TradeSideKey.Buy)}
                        active={activeTradeSide === TradeSideKey.Buy}
                      >
                        <MDBTypography
                          tag="p"
                          className="fs-6 fw-semibold m-0 lh-1"
                        >
                          Buy
                        </MDBTypography>
                      </MDBTabsLink>
                    </MDBTabsItem>
                    <MDBTabsItem>
                      <MDBTabsLink
                        className="py-2 px-3"
                        onClick={() => handleTradeSideChange(TradeSideKey.Sell)}
                        active={activeTradeSide === TradeSideKey.Sell}
                      >
                        <MDBTypography
                          tag="p"
                          className="fs-6 fw-semibold m-0 lh-1"
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
                    render={({ field }) => (
                      <AmountInput
                        {...field}
                        name="buy-amount"
                        iconSrc={stockImg}
                        label="You buy"
                        placeholder="0"
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
                      />
                    )}
                  />
                  <MDBBtn
                    onClick={buyForm.handleSubmit(onBuySubmit)}
                    className="w-100 rounded-3 p-3"
                  >
                    <MDBTypography tag="h6" className="fw-semibold m-0 lh-1">
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
                    render={({ field }) => (
                      <AmountInput
                        {...field}
                        name="sell-amount"
                        iconSrc={stockImg}
                        label="You sell"
                        placeholder="0"
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
                      />
                    )}
                  />
                  <button
                    onClick={sellForm.handleSubmit(onSellSubmit)}
                    className="btn btn-primary w-100 rounded-3 p-3"
                  >
                    <MDBTypography tag="h6" className="fw-semibold m-0 lh-1">
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
