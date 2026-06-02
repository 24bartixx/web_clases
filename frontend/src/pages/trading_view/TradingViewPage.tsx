import {
  MDBBtn,
  MDBCardText,
  MDBCol,
  MDBContainer,
  MDBRow,
  MDBSpinner,
  MDBTabs,
  MDBTabsItem,
  MDBTabsLink,
  MDBTypography,
} from 'mdb-react-ui-kit';
import { TimeUnit, TradingChart, TradingChartPeriod } from './TradingChart';
import stockImg from '../../assets/stock-30.png';
import moneyImg from '../../assets/money-30.png';
import { AmountInput } from './AmountInput';
import { useEffect, useState } from 'react';
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
import { calculatePriceMetrics } from '../../utils';

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

export function TradingViewPage() {
  // prettier-ignore
  const [activeTradeSide, setActiveTradeSide] = useState<TradeSideKey>(TradeSideKey.Buy,);
  const [activePeriod, setActivePeriod] = useState<PeriodKey>(PeriodKey.M1);
  const [isCompanyDetailsOpen, setIsCompanyDetailsOpen] = useState(false);

  const navigate = useNavigate();
  const { ticker } = useParams<{ ticker: string }>();
  const cleanTicker = ticker?.toUpperCase() || '';

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [currentDate, setCurrentDate] = useState('2020-02-01');

  const [stock, setStock] = useState<Stock | null>(null);
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null);
  const [priceRange, setPriceRange] = useState<Price[] | null>(null);

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

        const stockResponse = await fetch(apiUrl(`/api/stocks/${cleanTicker}`));

        if (!stockResponse.ok) {
          throw new Error(`Status: ${stockResponse.status}`);
        }

        const stockData: StockDto = await stockResponse.json();

        const detailsResponse = await fetch(
          apiUrl(`/api/stocks/${cleanTicker}/details`),
        );

        if (!detailsResponse.ok) {
          throw new Error(`Status: ${detailsResponse.status})`);
        }
        const detailsData: StockDetailsDto = await detailsResponse.json();

        const priceResponse = await fetch(
          apiUrl(
            `/api/stocks/${cleanTicker}/prices?start=${'2024-12-15'}&interval=1d`
          )
        );

        if (!priceResponse.ok) {
          throw new Error(`Status: ${priceResponse.status}`);
        }

        const priceRangeData: PriceDto[] = await priceResponse.json();

        setStock(mapStockDtoToStock(stockData));
        setStockDetails(mapStockDetailsDtoToStockDetails(detailsData));
        setPriceRange(
          priceRangeData.map((priceDto) => mapPriceDtoToPrice(priceDto)),
        );
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ticker]);

 

  const todayPrice: number = priceRange && priceRange.length > 0 ? priceRange[priceRange.length - 1].close : 0;
  const yesterdayPrice = priceRange && priceRange.length > 1 ? priceRange[priceRange.length - 2].close : undefined;

   const {currentPrice, priceChange, priceChangePercent } = calculatePriceMetrics(todayPrice, yesterdayPrice);


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

  const onBuySubmit = (data: SellOrBuyForm) => {
    console.log('Данные покупки:', data);
  };

  const onSellSubmit = (data: SellOrBuyForm) => {
    console.log('Данные продажи:', data);
  };


   if (loading) {
    return (
      <MDBContainer className="d-flex justify-content-center align-items-center vh-100">
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
        <MDBSpinner grow color="primary" className="mb-3"></MDBSpinner>
      </MDBContainer>
    );
  }

  if (error || !stock || !stockDetails || !priceRange) {
    return (
      <InfoModal
        open={true}
        title="Błąd"
        bodyText="Nie udało się znaleźć takiej akcji. Zostaniesz przekierowany na stronę główną."
        btnText="Zamknij"
        onClose={() => navigate('/')}
        onConfirm={() => navigate('/')}
      />
    );
  }


  return (
    <div className="container px-4 py-4 pb-4 border rounded-3 shadow-sm">
      <MDBContainer className="d-flex flex-column gap-3">
        <div className="border-bottom">
          <MDBRow className="align-items-center justify-content-between ">
            <MDBCol size="auto">
              <MDBRow className="align-items-end g-2">
                <MDBCol size="auto">
                  <button
                    className="btn p-0 m-0 border-0"
                    onClick={() => setIsCompanyDetailsOpen(true)}
                  >
                    <MDBTypography tag="h2" className="fw-bold">
                      {stock.ticker}
                    </MDBTypography>
                  </button>
                </MDBCol>
                <MDBCol size="auto">
                  <MDBTypography tag="h5" className="opacity-50">
                    {stock.companyName}
                  </MDBTypography>
                </MDBCol>
              </MDBRow>

              <MDBCol size="auto">
                <MDBTypography tag="p" className="fs-6 opacity-50">
                  {stock.sector} / {stock.industry}
                </MDBTypography>
              </MDBCol>
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
                  priceRange={priceRange}
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
                            Wszystko
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                    </MDBTabs>
                  </MDBCol>
                  <MDBCol fill size="auto" className="d-flex">
                    <MDBTypography tag="h6" className="fw-semibold m-0 lh-1">
                      {/* nie wiem  */}
                    </MDBTypography>
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
                          Kup
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
                          Sprzedaj
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
                        label="Kupujesz"
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
                        label="Spędzisz"
                        placeholder="0.00"
                      />
                    )}
                  />
                  <MDBBtn
                    onClick={buyForm.handleSubmit(onBuySubmit)}
                    className="w-100 rounded-3 p-3"
                  >
                    <MDBTypography tag="h6" className="fw-semibold m-0 lh-1">
                      Kup
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
                        label="Sprzedajesz"
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
                        label="Zarobisz"
                        placeholder="0.00"
                      />
                    )}
                  />
                  <button
                    onClick={sellForm.handleSubmit(onSellSubmit)}
                    className="btn btn-primary w-100 rounded-3 p-3"
                  >
                    <MDBTypography tag="h6" className="fw-semibold m-0 lh-1">
                      Sprzedaj
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
