import {
  MDBBtn,
  MDBCardText,
  MDBCol,
  MDBContainer,
  MDBIcon,
  MDBModal,
  MDBModalBody,
  MDBModalContent,
  MDBModalDialog,
  MDBModalFooter,
  MDBModalHeader,
  MDBModalTitle,
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
import { useEffect, useState } from 'react';
import { UTCTimestamp } from 'lightweight-charts';
import { Controller, useForm, useFormContext } from 'react-hook-form';
import { CompanyDetailsModal } from './CompanyDetails';

// Mirrors backend schema StockRead.
interface StockReadDto {
  // Внутренний идентификатор акции/компании в БД.
  stock_id: number;
  // Уникальный биржевой тикер (например, AAPL).
  ticker: string;
  // Официальное название компании.
  company_name: string | null;
  // Экономический сектор компании (например, Technology).
  sector: string | null;
  // Отрасль внутри сектора (например, Consumer Electronics).
  industry: string | null;
}

// Mirrors backend schema StockDetailsRead.
interface StockDetailsDto {
  // Текстовое описание бизнеса компании.
  description: string | null;
  // Общее количество выпущенных акций компании.
  sharesOutstanding: number | null;
  // Количество акций в свободном обращении.
  floatShares: number | null;
  // Страна регистрации/основной деятельности компании.
  country: string | null;
  // Валюта, в которой торгуется/отображается цена.
  currency: string | null;
  // Официальный сайт компании.
  website: string | null;
}

// Mirrors backend schema StockPriceRead.
interface StockPriceDto {
  // Дата и время ценовой свечи (ISO-строка).
  price_date: string;
  // Цена открытия за период.
  open: number;
  // Максимальная цена за период.
  high: number;
  // Минимальная цена за период.
  low: number;
  // Цена закрытия за период.
  close: number;
  // Объём торгов за период.
  volume: number;
  // Размер дивиденда за период (если был).
  dividend_amount: number | null;
}

// Convenient UI shape for company card rendering.
interface CompanyCardViewModel {
  // Отображаемое название компании в карточке.
  name: string;
  // Короткий биржевой код компании.
  ticker: string;
  // Сектор компании для инфо-блока.
  sector: string | null;
  // Отрасль компании для инфо-блока.
  industry: string | null;
  // Краткое описание компании.
  description: string | null;
  // Страна компании.
  country: string | null;
  // Ссылка на сайт компании.
  website: string | null;
  // Валюта отображаемой цены.
  currency: string | null;

  sharesOutstanding: number | null;
  floatShares: number | null;
  // Текущая цена.
  price: number;
  // Абсолютное изменение цены.
  change: number;
  // Изменение цены в процентах.
  changePercent: number;
}

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

  const data = 1780876800;
  const price = 150;

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

  const buyAmount = buyForm.watch('amount');
  const buyTotal = buyForm.watch('total');

  useEffect(() => {
    const activeName = document.activeElement?.getAttribute('name');

    if (activeName === 'buy-amount') {
      const newTotal = Number(buyAmount) * price;
      if (Number(buyTotal) !== newTotal) {
        buyForm.setValue('total', newTotal);
      }
    } else if (activeName === 'buy-total') {
      const newAmount = Number((Number(buyTotal) / price).toFixed(6));
      if (Number(buyAmount) !== newAmount) {
        buyForm.setValue('amount', newAmount);
      }
    }
  }, [buyAmount, buyTotal, buyForm.setValue]);

  const sellAmount = sellForm.watch('amount');
  const sellTotal = sellForm.watch('total');

  useEffect(() => {
    const activeName = document.activeElement?.getAttribute('name');

    if (activeName === 'sell-amount') {
      const newTotal = Number(sellAmount) * price;
      if (Number(sellTotal) !== newTotal) {
        sellForm.setValue('total', newTotal);
      }
    } else if (activeName === 'sell-total') {
      const newAmount = Number((Number(sellTotal) / price).toFixed(6));
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

  // prettier-ignore
  const data1 = [
  { time: 1777766400 as UTCTimestamp, open: 120.00, high: 122.50, low: 119.00, close: 121.80 },
  { time: 1777852800 as UTCTimestamp, open: 121.80, high: 125.00, low: 121.00, close: 124.20 },
  { time: 1777939200 as UTCTimestamp, open: 124.20, high: 126.80, low: 123.50, close: 126.00 },
  { time: 1778025600 as UTCTimestamp, open: 126.00, high: 128.50, low: 125.20, close: 127.90 },
  { time: 1778112000 as UTCTimestamp, open: 127.90, high: 129.00, low: 126.50, close: 128.50 },
  { time: 1778371200 as UTCTimestamp, open: 128.50, high: 132.00, low: 128.00, close: 131.50 },
  { time: 1778457600 as UTCTimestamp, open: 131.50, high: 133.50, low: 130.80, close: 132.80 },
  { time: 1778544000 as UTCTimestamp, open: 132.80, high: 134.00, low: 131.50, close: 133.50 },
  { time: 1778630400 as UTCTimestamp, open: 133.50, high: 135.50, low: 132.80, close: 135.00 },
  { time: 1778716800 as UTCTimestamp, open: 135.00, high: 137.20, low: 134.50, close: 136.80 },
  { time: 1778976000 as UTCTimestamp, open: 136.80, high: 140.00, low: 136.00, close: 139.50 },
  { time: 1779062400 as UTCTimestamp, open: 139.50, high: 142.00, low: 138.80, close: 141.20 },
  { time: 1779148800 as UTCTimestamp, open: 141.20, high: 143.50, low: 140.50, close: 142.80 },
  { time: 1779235200 as UTCTimestamp, open: 142.80, high: 145.00, low: 142.00, close: 144.50 },
  { time: 1779321600 as UTCTimestamp, open: 144.50, high: 147.20, low: 143.80, close: 146.50 },
  { time: 1779580800 as UTCTimestamp, open: 146.50, high: 148.80, low: 145.80, close: 148.00 },
  { time: 1779667200 as UTCTimestamp, open: 148.00, high: 150.50, low: 147.20, close: 149.80 },
  { time: 1779753600 as UTCTimestamp, open: 149.80, high: 152.00, low: 149.00, close: 151.50 },
  { time: 1779840000 as UTCTimestamp, open: 151.50, high: 153.50, low: 150.80, close: 152.80 },
  { time: 1779926400 as UTCTimestamp, open: 152.80, high: 155.00, low: 151.50, close: 154.20 },
  { time: 1780185600 as UTCTimestamp, open: 154.20, high: 157.50, low: 153.80, close: 156.50 },
  { time: 1780272000 as UTCTimestamp, open: 156.50, high: 159.00, low: 155.80, close: 158.20 },
  { time: 1780358400 as UTCTimestamp, open: 158.20, high: 161.00, low: 157.50, close: 160.50 },
  { time: 1780444800 as UTCTimestamp, open: 160.50, high: 163.50, low: 159.80, close: 162.00 },
  { time: 1780531200 as UTCTimestamp, open: 162.00, high: 164.80, low: 161.00, close: 163.50 },
  { time: 1780617600 as UTCTimestamp, open: 163.50, high: 165.50, low: 162.20, close: 164.80 },
  { time: 1780876800 as UTCTimestamp, open: 164.80, high: 167.00, low: 163.50, close: 166.20 },
];
  // prettier-ignore
  const data2 = [
      { time: '2026-04-20', value: 4500000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-04-21', value: 6200000, color: 'rgba(255, 68, 68, 0.5)' },
      { time: '2026-04-22', value: 5800000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-04-23', value: 7100000, color: 'rgba(255, 68, 68, 0.5)' },
      { time: '2026-04-24', value: 5300000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-04-27', value: 6900000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-04-28', value: 7400000, color: 'rgba(255, 68, 68, 0.5)' },
      { time: '2026-04-29', value: 8200000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-04-30', value: 6700000, color: 'rgba(255, 68, 68, 0.5)' },
      { time: '2026-05-01', value: 7600000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-05-04', value: 8400000, color: 'rgba(255, 68, 68, 0.5)' },
      { time: '2026-05-05', value: 9200000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-05-06', value: 7800000, color: 'rgba(255, 68, 68, 0.5)' },
      { time: '2026-05-07', value: 8900000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-05-08', value: 7300000, color: 'rgba(255, 68, 68, 0.5)' },
      { time: '2026-05-11', value: 9100000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-05-12', value: 8600000, color: 'rgba(255, 68, 68, 0.5)' },
      { time: '2026-05-13', value: 10200000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-05-14', value: 8400000, color: 'rgba(255, 68, 68, 0.5)' },
      { time: '2026-05-15', value: 9800000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-05-18', value: 8700000, color: 'rgba(255, 68, 68, 0.5)' },
      { time: '2026-05-19', value: 10500000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-05-20', value: 9100000, color: 'rgba(255, 68, 68, 0.5)' },
      { time: '2026-05-21', value: 11200000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-05-22', value: 9700000, color: 'rgba(255, 68, 68, 0.5)' },
      { time: '2026-05-23', value: 10800000, color: 'rgba(0, 255, 38, 0.5)' },
      { time: '2026-05-26', value: 11500000, color: 'rgba(0, 255, 38, 0.5)' },
    ]

  const stock: StockReadDto = {
    stock_id: 1,
    ticker: 'AAPL',
    company_name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
  };

  const stockDetails: StockDetailsDto = {
    description:
      'Apple designs and sells consumer electronics, software, and services.',
    sharesOutstanding: 15200000000,
    floatShares: 15100000000,
    country: 'United States',
    currency: 'USD',
    website: 'https://www.apple.com',
  };

  const latestPrice: StockPriceDto = {
    price_date: '2026-05-26T00:00:00',
    open: 148.9,
    high: 151.2,
    low: 148.2,
    close: 150.25,
    volume: 72100000,
    dividend_amount: null,
  };

  const previousClose = 147.9; // Cena w momencie zamknięcia poprzedniego dnia
  const change = latestPrice.close - previousClose;
  const changePercent = (change / previousClose) * 100;

  const company: CompanyCardViewModel = {
    name: stock.company_name ?? '',
    ticker: stock.ticker,
    sector: stock.sector,
    industry: stock.industry,
    description: stockDetails.description,
    country: stockDetails.country,
    website: stockDetails.website,
    currency: stockDetails.currency,
    sharesOutstanding: stockDetails.sharesOutstanding,
    floatShares: stockDetails.floatShares,
    price: latestPrice.close,
    change,
    changePercent,
  };

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
                      {company.ticker}
                    </MDBTypography>
                  </button>
                </MDBCol>
                <MDBCol size="auto">
                  <MDBTypography tag="h5" className="opacity-50">
                    {company.name}
                  </MDBTypography>
                </MDBCol>
              </MDBRow>

              <MDBCol size="auto">
                <MDBTypography tag="p" className="fs-6 opacity-50">
                  {company.sector} / {company.industry}
                </MDBTypography>
              </MDBCol>
            </MDBCol>

            <MDBCol size="auto">
              <MDBRow className="align-items-center g-2">
                <MDBCol size="auto">
                  <MDBTypography tag="p" className={`fs-5 fw-semibold`}>
                    {company.price} {company.currency}
                  </MDBTypography>
                </MDBCol>

                <MDBCol size="auto">
                  <MDBTypography
                    tag="p"
                    className={`fs-6 ${company.change >= 0 ? 'text-price-up' : 'text-price-down'}`}
                  >
                    {company.change >= 0 ? '+' : '-'}
                    {Math.abs(company.change).toFixed(2)}
                  </MDBTypography>
                </MDBCol>
                <MDBCol size="auto">
                  <MDBTypography
                    tag="p"
                    className={`fs-6 ${company.change >= 0 ? 'text-price-up' : 'text-price-down'}`}
                  >
                    ({Math.abs(company.changePercent).toFixed(2)}%)
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
                  candleSeriesData={data1}
                  volumeSeriesData={data2}
                  period={periods[activePeriod]}
                />
              </div>
              <div className="border rounded-3 shadow-sm p-1">
                <MDBRow className="align-items-center justify-content-between  g-3">
                  <MDBCol size="auto">
                    <MDBTabs pills fill>
                      <MDBTabsItem>
                        <MDBTabsLink className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.D1)}
                          active={activePeriod === PeriodKey.D1}
                        >
                          <MDBTypography tag="h6" className="fw-semibold m-0 lh-1">
                            {PeriodKey.D1}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.D3)}
                          active={activePeriod === PeriodKey.D3}
                        >
                          <MDBTypography tag="h6" className="fw-semibold m-0 lh-1">
                            {PeriodKey.D3}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.M1)}
                          active={activePeriod === PeriodKey.M1}
                        >
                          <MDBTypography tag="h6" className="fw-semibold m-0 lh-1">
                            {PeriodKey.M1}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.M3)}
                          active={activePeriod === PeriodKey.M3}
                        >
                          <MDBTypography tag="h6" className="fw-semibold m-0 lh-1">
                            {PeriodKey.M3}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.M6)}
                          active={activePeriod === PeriodKey.M6}
                        >
                          <MDBTypography tag="h6" className="fw-semibold m-0 lh-1">
                            {PeriodKey.M6}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.Y1)}
                          active={activePeriod === PeriodKey.Y1}
                        >
                          <MDBTypography tag="h6" className="fw-semibold m-0 lh-1">
                            {PeriodKey.Y1}
                          </MDBTypography>
                        </MDBTabsLink>
                      </MDBTabsItem>
                      <MDBTabsItem>
                        <MDBTabsLink className="py-2 px-3"
                          onClick={() => handlePeriodChange(PeriodKey.ALL)}
                          active={activePeriod === PeriodKey.ALL}
                        >
                          <MDBTypography tag="h6" className="fw-semibold m-0 lh-1">
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
                      <MDBTabsLink className="py-2 px-3"
                        onClick={() => handleTradeSideChange(TradeSideKey.Buy)}
                        active={activeTradeSide === TradeSideKey.Buy}
                      >
                        <MDBTypography tag="p"  className="fs-6 fw-semibold m-0 lh-1">
                          Kup
                        </MDBTypography>
                      </MDBTabsLink>
                    </MDBTabsItem>
                    <MDBTabsItem>
                      <MDBTabsLink className="py-2 px-3"
                        onClick={() => handleTradeSideChange(TradeSideKey.Sell)}
                        active={activeTradeSide === TradeSideKey.Sell}
                      >
                        <MDBTypography tag="p"  className="fs-6 fw-semibold m-0 lh-1" style={{ fontSize: '16px' }}>
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
                    <MDBTypography
                      tag="h6"
                      className="fw-semibold m-0 lh-1"
                    >
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
                    <MDBTypography
                      tag="h6"
                      className="fw-semibold m-0 lh-1"
                    >
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
        company={company}
      />
    </div>
  );
}

export default TradingViewPage;
