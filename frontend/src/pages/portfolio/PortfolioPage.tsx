import { useEffect, useMemo, useState } from 'react';
import {
  MDBCard,
  MDBCardBody,
  MDBCol,
  MDBContainer,
  MDBIcon,
  MDBRow,
  MDBTable,
  MDBTableBody,
  MDBTableHead,
  MDBTypography,
} from 'mdb-react-ui-kit';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Area,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CustomLoading } from '../../components/Common/CustomLoading';
import { useGame } from '../../contexts/GameContext';
import { apiUrl } from '../../utils/apiUrl';
import { auth_fetch } from '../../utils/auth_fetch';
import './PortfolioPage.css';

const COLORS = [
  '#87d1eb',
  '#b3cad4',
  '#3fb28f',
  '#d0ed57',
  '#ffc658',
  '#a4de6c',
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

interface SimulationHistoryItemDto {
  balance: number | string;
  timestamp: string;
}

interface HistoryChartPoint {
  timestamp: string;
  shortDateLabel: string;
  fullDateLabel: string;
  value: number;
}

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatPercent = (value: number) =>
  `${value > 0 ? '+' : ''}${percentFormatter.format(value)}%`;

const toHistoryChartPoint = (
  historyItem: SimulationHistoryItemDto,
): HistoryChartPoint => {
  const timestamp = historyItem.timestamp;
  const date = new Date(timestamp);
  const hasValidDate = !Number.isNaN(date.getTime());
  const value = Number(historyItem.balance);

  return {
    timestamp,
    shortDateLabel: hasValidDate ? shortDateFormatter.format(date) : timestamp,
    fullDateLabel: hasValidDate ? fullDateFormatter.format(date) : timestamp,
    value: Number.isFinite(value) ? value : 0,
  };
};

export function PortfolioPage() {
  const navigate = useNavigate();
  const { simulationId } = useParams<{ simulationId: string }>();
  const { gameState } = useGame();

  const parsedSimulationId =
    simulationId === undefined ? NaN : Number(simulationId);
  const activeSimulationId = Number.isInteger(parsedSimulationId)
    ? parsedSimulationId
    : gameState.simulationId;

  const [historyData, setHistoryData] = useState<HistoryChartPoint[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      if (activeSimulationId === null) {
        if (isMounted) {
          setHistoryData([]);
          setIsHistoryLoading(false);
        }

        return;
      }

      setIsHistoryLoading(true);

      try {
        const response = await auth_fetch(
          apiUrl(
            `/api/simulation-history/?simulation_id=${activeSimulationId}`,
          ),
        );

        if (!response.ok) {
          throw new Error(`Status: ${response.status}`);
        }

        const historyItems: SimulationHistoryItemDto[] = await response.json();

        if (!isMounted) {
          return;
        }

        const sortedHistory = historyItems
          .map(toHistoryChartPoint)
          .sort((left, right) => {
            const leftDate = new Date(left.timestamp).getTime();
            const rightDate = new Date(right.timestamp).getTime();
            return leftDate - rightDate;
          });

        setHistoryData(sortedHistory);
      } catch (error) {
        console.error('Failed to load portfolio history', error);

        if (isMounted) {
          setHistoryData([]);
        }
      } finally {
        if (isMounted) {
          setIsHistoryLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [activeSimulationId, gameState.currentBalance]);

  const activePositions = useMemo(() => {
    return (gameState.stockPositions ?? []).filter(
      (position) => position.amount > 0,
    );
  }, [gameState.stockPositions]);

  const allocationData = useMemo(() => {
    return activePositions
      .map((position) => ({
        name: position.stock.companyName || position.stock.ticker,
        ticker: position.stock.ticker,
        shares: position.amount,
        value: position.amount * position.currentPrice,
      }))
      .sort((left, right) => right.value - left.value);
  }, [activePositions]);

  const totalAllocationValue = useMemo(() => {
    return allocationData.reduce((total, item) => total + item.value, 0);
  }, [allocationData]);

  const totalValue = gameState.currentBalance ?? 0;
  const initialBalance = gameState.initialBalance ?? 0;
  const totalGain = totalValue - initialBalance;
  const totalGainPercent =
    initialBalance > 0 ? (totalGain / initialBalance) * 100 : 0;
  const dayChange = activePositions.reduce(
    (total, position) => total + position.priceChange * position.amount,
    0,
  );
  const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

  if (isHistoryLoading || gameState.status === 'loading') {
    return (
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <CustomLoading />
      </div>
    );
  }

  if (activeSimulationId === null) {
    return (
      <MDBContainer className="d-flex flex-grow-1 align-items-center justify-content-center">
        <MDBCard className="border portfolio-page__empty-state rounded-3">
          <MDBCardBody className="text-center">
            <h2 className="mb-3 h5">Could not load portfolio</h2>
            <p className="mb-4 text-muted">
              No active simulation found for this portfolio.
            </p>
            <button
              type="button"
              className="px-4 btn btn-primary rounded-pill"
              onClick={() => navigate('/')}
            >
              Back home
            </button>
          </MDBCardBody>
        </MDBCard>
      </MDBContainer>
    );
  }

  return (
    <div className="container px-4 py-3 pb-4 my-4 border shadow-sm rounded-3 d-flex flex-column portfolio-page">
      <MDBContainer className="flex-grow-1 d-flex flex-column">
        
        <MDBRow className="flex-shrink-0 mb-3 g-3">
          <MDBCol md="3" sm="6">
            <MDBCard className="border shadow-sm portfolio-page__metric-card h-100 rounded-3">
              <MDBCardBody className="p-3">
                <div className="mb-1.5 d-flex justify-content-between align-items-center">
                  <span className="text-white/40 text-[0.7rem] uppercase tracking-wider font-medium">Total Value</span>
                  <MDBIcon fas icon="dollar-sign" className="text-white/30 text-xs" />
                </div>
                <div className="text-xl font-bold text-white leading-none mb-1.5">
                  {formatCurrency(totalValue)}
                </div>
                <span className={`text-xs font-medium ${totalGain >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                  <MDBIcon
                    fas
                    icon={totalGain >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'}
                    className="me-1"
                  />
                  {formatPercent(totalGainPercent)} all time
                </span>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>

          <MDBCol md="3" sm="6">
            <MDBCard className="border shadow-sm portfolio-page__metric-card h-100 rounded-3">
              <MDBCardBody className="p-3">
                <div className="mb-1.5 d-flex justify-content-between align-items-center">
                  <span className="text-white/40 text-[0.7rem] uppercase tracking-wider font-medium">Total Gain</span>
                  <MDBIcon
                    fas
                    icon="chart-line"
                    className={`text-xs ${totalGain >= 0 ? 'text-price-up' : 'text-price-down'}`}
                  />
                </div>
                <div className={`text-xl font-bold leading-none mb-1.5 ${totalGain >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                  {totalGain >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(totalGain))}
                </div>
                <span className={`text-xs font-medium ${totalGain >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                  <MDBIcon
                    fas
                    icon={totalGain >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'}
                    className="me-1"
                  />
                  {formatPercent(totalGainPercent)} all time
                </span>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>

          <MDBCol md="3" sm="6">
            <MDBCard className="border shadow-sm portfolio-page__metric-card h-100 rounded-3">
              <MDBCardBody className="p-3">
                <div className="mb-1.5 d-flex justify-content-between align-items-center">
                  <span className="text-white/40 text-[0.7rem] uppercase tracking-wider font-medium">Day Change</span>
                  <MDBIcon
                    fas
                    icon="calendar-day"
                    className={`text-xs ${dayChange >= 0 ? 'text-price-up' : 'text-price-down'}`}
                  />
                </div>
                <div className={`text-xl font-bold leading-none mb-1.5 ${dayChange >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                  {dayChange >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(dayChange))}
                </div>
                <span className={`text-xs font-medium ${dayChange >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                  <MDBIcon
                    fas
                    icon={dayChange >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'}
                    className="me-1"
                  />
                  {formatPercent(dayChangePercent)} today
                </span>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>

          <MDBCol md="3" sm="6">
            <MDBCard className="border shadow-sm portfolio-page__metric-card h-100 rounded-3">
              <MDBCardBody className="p-3">
                <div className="mb-1.5 d-flex justify-content-between align-items-center">
                  <span className="text-white/40 text-[0.7rem] uppercase tracking-wider font-medium">Holdings</span>
                  <MDBIcon fas icon="briefcase" className="text-white/30 text-xs" />
                </div>
                <div className="text-xl font-bold text-white leading-none mb-1.5">
                  {activePositions.length}
                </div>
                <span className="text-xs text-white/40 font-medium">stocks in portfolio</span>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>

        {/* ГРАФИКИ */}
        <MDBRow className="flex-shrink-0 mb-3 g-3">
          <MDBCol lg="8">
            <MDBCard className="border shadow-sm portfolio-page__chart-card h-100 rounded-3">
              <MDBCardBody className="d-flex flex-column p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                  Portfolio Performance
                </div>
                <div className="portfolio-page__chart-area">
                  {historyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyData}>
                        <defs>
                          <linearGradient
                            id="portfolioBalanceGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#87d1eb" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#87d1eb" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#40484c" vertical={false} />
                        <XAxis
                          dataKey="shortDateLabel"
                          stroke="#899296"
                          tick={{ fill: '#899296', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={30}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          domain={['auto', 'auto']}
                          stroke="#899296"
                          tick={{ fill: '#899296', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value: number) => `$${Number(value).toLocaleString()}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1b2023',
                            border: '1px solid #40484c',
                            borderRadius: '8px',
                          }}
                          itemStyle={{ color: '#dee3e6', fontSize: 12 }}
                          labelStyle={{ color: '#b3cad4', fontSize: 11 }}
                          formatter={(value: any) => [
                            formatCurrency(Number(value ?? 0)),
                            'Balance',
                          ]}
                          labelFormatter={(_label: any, payload: any) =>
                            (payload as unknown as Array<{ payload?: HistoryChartPoint }>)
                              ?.[0]?.payload?.fullDateLabel ?? String(_label)
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          fill="url(#portfolioBalanceGradient)"
                          stroke="none"
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#87d1eb"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex h-100 justify-content-center align-items-center text-white/30 text-sm">
                      No history data
                    </div>
                  )}
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>

          <MDBCol lg="4">
            <MDBCard className="border shadow-sm portfolio-page__chart-card h-100 rounded-3">
              <MDBCardBody className="d-flex flex-column p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                  Allocation
                </div>
                <div className="portfolio-page__chart-area position-relative">
                  {allocationData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="46%"
                          innerRadius="50%"
                          outerRadius="80%"
                          paddingAngle={2}
                          nameKey="ticker"
                          dataKey="value"
                          stroke="none"
                        >
                          {allocationData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1b2023',
                            border: '1px solid #40484c',
                            borderRadius: '8px',
                          }}
                          itemStyle={{ fontSize: 12 }}
                          formatter={(value: any, ticker) => [
                            formatCurrency(Number(value ?? 0)),
                            ticker,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex h-100 justify-content-center align-items-center text-white/30 text-sm">
                      No holdings
                    </div>
                  )}
                </div>

                {allocationData.length > 0 && (
                  <div className="mt-3 portfolio-page__allocation-list">
                    {allocationData.slice(0, 5).map((item, index) => {
                      const sharePercent =
                        totalAllocationValue > 0 ? (item.value / totalAllocationValue) * 100 : 0;

                      return (
                        <div
                          key={item.ticker}
                          className="gap-2 portfolio-page__allocation-item d-flex align-items-center justify-content-between"
                        >
                          <div className="gap-2 d-flex align-items-center">
                            <span
                              className="portfolio-page__allocation-dot rounded-circle"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-xs text-white/80 font-medium">{item.ticker}</span>
                          </div>
                          <span className="text-xs text-white/40 font-mono">
                            {percentFormatter.format(sharePercent)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>

        <div className="pt-2 pb-2 mt-2 portfolio-page__table-wrap pe-2 border-top border-white/10">
          <MDBTable responsive hover className="mb-0 align-middle">
            <MDBTableHead className="border-b border-white/10">
              <tr>
                <th scope="col" className="text-white bg-transparent border-0 text-xs uppercase tracking-wider font-semibold py-2">
                  Companies <MDBIcon fas icon="sort" className="ms-1 text-white/20" />
                </th>
                <th scope="col" className="text-white bg-transparent border-0 text-xs uppercase tracking-wider font-semibold py-2">
                  Change % <MDBIcon fas icon="sort" className="ms-1 text-white/20" />
                </th>
                <th scope="col" className="text-white bg-transparent border-0 text-xs uppercase tracking-wider font-semibold py-2">
                  Price <MDBIcon fas icon="sort" className="ms-1 text-white/20" />
                </th>
                <th scope="col" className="text-white bg-transparent border-0 text-xs uppercase tracking-wider font-semibold py-2">
                  Value <MDBIcon fas icon="sort" className="ms-1 text-white/20" />
                </th>
                <th scope="col" className="text-white bg-transparent border-0 text-xs uppercase tracking-wider font-semibold py-2">
                  Shares <MDBIcon fas icon="sort" className="ms-1 text-white/20" />
                </th>
              </tr>
            </MDBTableHead>
            <MDBTableBody>
              {activePositions.length > 0 ? (
                activePositions.map((position) => {
                  const value = position.amount * position.currentPrice;
                  return (
                    <tr
                      key={position.positionId}
                      onClick={() =>
                        navigate(
                          `/game/${activeSimulationId}/trading-view/${position.stock.ticker}`,
                          { state: { gameMenuSection: 'portfolio' } },
                        )
                      }
                      style={{ cursor: 'pointer' }}
                      className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-2.5">
                        <div className="d-flex align-items-center">
                          <div
                            className="p-1 overflow-hidden bg-white rounded-circle me-2.5 d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px' }}
                          >
                            <img
                              src={`https://img.logo.dev/ticker/${position.stock.ticker}?token=${process.env.REACT_APP_LOGO_STOCK_TOKEN}`}
                              alt=""
                              className="w-100 h-100 object-fit-contain"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white leading-tight">
                              {position.stock.ticker}
                            </div>
                            <div className="text-xs text-white/40 leading-none">
                              {position.stock.companyName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-sm font-semibold ${
                          position.priceChangePercent >= 0 ? 'text-price-up' : 'text-price-down'
                        }`}>
                          {position.priceChangePercent >= 0 ? '+' : ''}
                          {position.priceChangePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 text-sm text-white font-medium">
                        {formatCurrency(position.currentPrice)}
                      </td>
                      <td className="py-2.5 text-sm text-white font-semibold">
                        {formatCurrency(value)}
                      </td>
                      <td className="py-2.5 text-sm text-white font-mono">
                        {position.amount}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-5 text-center bg-transparent border-0 text-white text-sm">
                    Your portfolio is empty
                  </td>
                </tr>
              )}
            </MDBTableBody>
          </MDBTable>
        </div>
      </MDBContainer>
    </div>
  );
}