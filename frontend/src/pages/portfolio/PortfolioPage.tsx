import React, { useEffect, useMemo, useState } from 'react';
import { MDBContainer, MDBRow, MDBCol, MDBCard, MDBCardBody, MDBTypography, MDBIcon, MDBTable, MDBTableHead, MDBTableBody } from 'mdb-react-ui-kit';
import { useGame } from '../../contexts/GameContext';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserInfo, UserInfo } from '../../api/userApi';
import { apiUrl } from '../../utils/apiUrl';
import { auth_fetch } from '../../utils/auth_fetch';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { CustomLoading } from '../../components/Common/CustomLoading';

declare var process: any;

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#00C49F'];

export function PortfolioPage() {
  const navigate = useNavigate();
  const { simulationId } = useParams<{ simulationId: string }>();
  const { gameState } = useGame();
  
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const user = await getUserInfo();
        if (isMounted) setUserInfo(user);

        if (gameState.simulationId) {
          const res = await auth_fetch(apiUrl(`/api/simulation-history/?simulation_id=${gameState.simulationId}&limit=100`));
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              const formattedData = data.map((d: any) => {
                const date = new Date(d.timestamp);
                return {
                  name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: Number(d.balance),
                };
              });
              setHistoryData(formattedData.reverse());
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadData();
    
    return () => { isMounted = false; };
  }, [gameState.simulationId]);

  const activePositions = useMemo(() => {
    return (gameState.stockPositions || []).filter(p => p.amount > 0);
  }, [gameState.stockPositions]);

  const allocationData = useMemo(() => {
    return activePositions.map((p) => ({
      name: p.stock.companyName || p.stock.ticker,
      value: p.amount,
      totalValue: p.amount * p.currentPrice,
    })).sort((a, b) => b.value - a.value);
  }, [activePositions]);

  const totalValue = gameState.currentBalance ?? 0;
  const initialBalance = gameState.initialBalance ?? 0;
  const totalGain = totalValue - initialBalance;
  const totalGainPercent = initialBalance > 0 ? (totalGain / initialBalance) * 100 : 0;

  const dayChange = activePositions.reduce((acc, p) => acc + (p.priceChange * p.amount), 0);
  const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

  if (loading || gameState.status === 'loading') {
    return (
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <CustomLoading />
      </div>
    );
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatPercent = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;

  return (
    <div className="container px-4 py-3 pb-4 my-4 border shadow-sm rounded-3 d-flex flex-column" style={{ height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      <div className="mt-2 mb-2">
        <button
          className="p-0 m-0 text-white bg-transparent border-0 btn me-4"
          onClick={() => navigate(`/game/${simulationId}/stocks-view`)}
          aria-label="Go back"
        >
          <MDBTypography tag="h2" className="m-0 fw-semibold">
            ←
          </MDBTypography>
        </button>
      </div>

      <MDBContainer className="flex-grow-1 d-flex flex-column" style={{ overflow: 'hidden' }}>
        <MDBRow className="flex-shrink-0 mb-3 g-3">
          <MDBCol md="3" sm="6">
            <MDBCard className="bg-transparent border shadow-sm h-100 rounded-3">
              <MDBCardBody className="p-3">
                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Total Value</span>
                  <MDBIcon fas icon="dollar-sign" className="text-muted" />
                </div>
                <MDBTypography tag="h3" className="mb-1 text-white fw-bold">{formatCurrency(totalValue)}</MDBTypography>
                <span className={`small ${totalGain >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                  <MDBIcon fas icon={totalGain >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'} className="me-1" />
                  {formatPercent(totalGainPercent)} all time
                </span>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>

          <MDBCol md="3" sm="6">
            <MDBCard className="bg-transparent border shadow-sm h-100 rounded-3">
              <MDBCardBody className="p-3">
                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Total Gain</span>
                  <MDBIcon fas icon="chart-line" className={totalGain >= 0 ? 'text-price-up' : 'text-price-down'} />
                </div>
                <MDBTypography tag="h3" className={`fw-bold mb-1 ${totalGain >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                  {totalGain > 0 ? '+' : ''}{formatCurrency(totalGain)}
                </MDBTypography>
                <span className={`small ${totalGain >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                  <MDBIcon fas icon={totalGain >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'} className="me-1" />
                  {formatPercent(totalGainPercent)} all time
                </span>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>

          <MDBCol md="3" sm="6">
            <MDBCard className="bg-transparent border shadow-sm h-100 rounded-3">
              <MDBCardBody className="p-3">
                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Day Change</span>
                  <MDBIcon fas icon="calendar-day" className={dayChange >= 0 ? 'text-price-up' : 'text-price-down'} />
                </div>
                <MDBTypography tag="h3" className={`fw-bold mb-1 ${dayChange >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                  {dayChange > 0 ? '+' : ''}{formatCurrency(dayChange)}
                </MDBTypography>
                <span className={`small ${dayChange >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                  <MDBIcon fas icon={dayChange >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'} className="me-1" />
                  {formatPercent(dayChangePercent)} today
                </span>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>

          <MDBCol md="3" sm="6">
            <MDBCard className="bg-transparent border shadow-sm h-100 rounded-3">
              <MDBCardBody className="p-3">
                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Holdings</span>
                  <MDBIcon fas icon="briefcase" className="text-muted" />
                </div>
                <MDBTypography tag="h3" className="mb-1 text-white fw-bold">{activePositions.length}</MDBTypography>
                <span className="small text-muted">
                  stocks in portfolio
                </span>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>

        <MDBRow className="flex-shrink-0 mb-3 g-3">
          <MDBCol lg="8">
            <MDBCard className="bg-transparent border shadow-sm h-100 rounded-3">
              <MDBCardBody className="d-flex flex-column">
                <MDBTypography tag="h6" className="mb-4 text-muted">Portfolio Performance</MDBTypography>
                <div style={{ flex: 1, minHeight: '150px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#40484c" vertical={false} />
                      <XAxis dataKey="name" stroke="#899296" tick={{ fill: '#899296', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} stroke="#899296" tick={{ fill: '#899296', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val.toLocaleString()}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1b2023', border: '1px solid #40484c', borderRadius: '8px' }}
                        itemStyle={{ color: '#dee3e6' }}
                        formatter={(value: any) => [formatCurrency(value), 'Balance']}
                      />
                      <Line type="monotone" dataKey="value" stroke="#87d1eb" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
          <MDBCol lg="4">
            <MDBCard className="bg-transparent border shadow-sm h-100 rounded-3">
              <MDBCardBody className="d-flex flex-column">
                <MDBTypography tag="h6" className="mb-4 text-muted">Allocation</MDBTypography>
                <div style={{ flex: 1, minHeight: '150px', position: 'relative' }}>
                  {allocationData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius="95%"
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1b2023', border: '1px solid #40484c', borderRadius: '8px' }}
                          formatter={(value: any) => formatCurrency(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex h-100 justify-content-center align-items-center text-muted">
                      No holdings
                    </div>
                  )}
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }} className="pt-2 pb-2 mt-2 pe-2 border-top border-secondary">
          <MDBTable responsive hover className="mb-0 align-middle">
            <MDBTableHead className="border-bottom border-secondary">
              <tr>
                <th scope="col" className="text-white bg-transparent border-0">Companies <MDBIcon fas icon="sort" /></th>
                <th scope="col" className="text-white bg-transparent border-0">Change % <MDBIcon fas icon="sort" /></th>
                <th scope="col" className="text-white bg-transparent border-0">Price <MDBIcon fas icon="sort" /></th>
                <th scope="col" className="text-white bg-transparent border-0">Value <MDBIcon fas icon="sort" /></th>
                <th scope="col" className="text-white bg-transparent border-0">Shares <MDBIcon fas icon="sort" /></th>
                <th scope="col" className="text-white bg-transparent border-0">Sector <MDBIcon fas icon="sort" /></th>
              </tr>
            </MDBTableHead>
            <MDBTableBody>
              {activePositions.length > 0 ? activePositions.map((p) => {
                const value = p.amount * p.currentPrice;
                return (
                  <tr key={p.positionId} onClick={() => navigate(`/game/${simulationId}/trading-view/${p.stock.ticker}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="p-1 overflow-hidden bg-white rounded-circle me-3" style={{ width: '40px', height: '40px' }}>
                          <img src={`https://img.logo.dev/ticker/${p.stock.ticker}?token=${(process as any).env.REACT_APP_LOGO_STOCK_TOKEN}`} alt="" className="w-100 h-100 object-fit-contain" />
                        </div>
                        <div>
                          <MDBTypography tag="p" className="mb-0 text-white fw-bold">{p.stock.ticker}</MDBTypography>
                          <MDBTypography tag="p" className="mb-0 text-muted small">{p.stock.companyName}</MDBTypography>
                        </div>
                      </div>
                    </td>
                    <td>
                      <MDBTypography tag="p" className={`mb-0 ${p.priceChangePercent >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                        {p.priceChangePercent.toFixed(2)}%
                      </MDBTypography>
                    </td>
                    <td>
                      <MDBTypography tag="p" className="mb-0 text-white">{formatCurrency(p.currentPrice)}</MDBTypography>
                    </td>
                    <td>
                      <MDBTypography tag="p" className="mb-0 text-white">{formatCurrency(value)}</MDBTypography>
                    </td>
                    <td>
                      <MDBTypography tag="p" className="mb-0 text-white">{p.amount}</MDBTypography>
                    </td>
                    <td>
                      <MDBTypography tag="p" className="mb-0 text-white">{p.stock.sector}</MDBTypography>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center bg-transparent border-0 text-muted">
                    Your portfolio is empty.
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
