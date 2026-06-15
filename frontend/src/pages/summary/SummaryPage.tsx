import { useEffect, useMemo } from 'react';
import {
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCol,
  MDBContainer,
  MDBIcon,
  MDBRow,
  MDBTypography,
} from 'mdb-react-ui-kit';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { CustomLoading } from '../../components/Common/CustomLoading';
import { useGame } from '../../contexts/GameContext';
import './SummaryPage.css';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const formatCurrency = (value: number | null) =>
  value === null ? '--' : currencyFormatter.format(value);

const parseDateOnly = (dateValue: string | null) => {
  if (dateValue === null) {
    return null;
  }

  const [year, month, day] = dateValue.slice(0, 10).split('-').map(Number);

  if ([year, month, day].some((value) => Number.isNaN(value))) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const formatDateOnly = (dateValue: string | null) => {
  const date = parseDateOnly(dateValue);
  return date === null ? '--' : dateFormatter.format(date);
};

const formatDateTime = (dateValue: string | null) => {
  if (dateValue === null) {
    return '--';
  }

  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? '--' : dateTimeFormatter.format(date);
};

type SummaryMetricProps = {
  icon: string;
  label: string;
  value: string;
  valueClassName?: string;
};

const SummaryMetric = ({
  icon,
  label,
  value,
  valueClassName = '',
}: SummaryMetricProps) => (
  <MDBCard className="summary-page__metric-card border rounded-3 h-100">
    <MDBCardBody className="p-3 d-flex flex-column gap-2">
      <div className="d-flex align-items-center justify-content-between">
        <span className="small text-muted">{label}</span>
        <MDBIcon fas icon={icon} className="text-muted" />
      </div>
      <MDBTypography tag="h5" className={`mb-0 fw-bold ${valueClassName}`}>
        {value}
      </MDBTypography>
    </MDBCardBody>
  </MDBCard>
);

export function SummaryPage() {
  const navigate = useNavigate();
  const { simulationId } = useParams<{ simulationId: string }>();
  const { gameState, resumeGame } = useGame();

  const parsedSimulationId =
    simulationId === undefined ? NaN : Number(simulationId);
  const isValidSimulationId = Number.isInteger(parsedSimulationId);
  const isLoadedSimulation = gameState.simulationId === parsedSimulationId;

  useEffect(() => {
    if (
      !isValidSimulationId ||
      isLoadedSimulation ||
      gameState.status === 'loading'
    ) {
      return;
    }

    resumeGame(parsedSimulationId);
  }, [
    gameState.status,
    isLoadedSimulation,
    isValidSimulationId,
    parsedSimulationId,
    resumeGame,
  ]);

  const openPositions = useMemo(
    () =>
      (gameState.stockPositions ?? []).filter((position) => position.amount > 0),
    [gameState.stockPositions],
  );

  const topPositions = useMemo(() => {
    return openPositions
      .map((position) => ({
        ticker: position.stock.ticker,
        companyName: position.stock.companyName || position.stock.ticker,
        marketValue: position.amount * position.currentPrice,
        shares: position.amount,
        changePercent: position.priceChangePercent,
      }))
      .sort((left, right) => right.marketValue - left.marketValue)
      .slice(0, 5);
  }, [openPositions]);

  if (!isValidSimulationId) {
    return <Navigate to="/" replace />;
  }

  if (!isLoadedSimulation && gameState.status !== 'error') {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <CustomLoading />
      </div>
    );
  }

  if (!isLoadedSimulation || gameState.status === 'error') {
    return (
      <MDBContainer className="summary-page d-flex align-items-center justify-content-center py-5">
        <MDBCard className="summary-page__panel border rounded-4 w-100">
          <MDBCardBody className="p-4 p-md-5 text-center">
            <MDBTypography tag="h1" className="h3 fw-bold mb-3">
              Could not load this game
            </MDBTypography>
            <p className="text-muted mb-4">
              The simulation might not exist or you do not have access to it.
            </p>
            <MDBBtn onClick={() => navigate('/')} className="rounded-pill px-4">
              Back home
            </MDBBtn>
          </MDBCardBody>
        </MDBCard>
      </MDBContainer>
    );
  }

  if (gameState.finishedAt === null) {
    return (
      <MDBContainer className="summary-page d-flex align-items-center justify-content-center py-5">
        <MDBCard className="summary-page__panel border rounded-4 w-100">
          <MDBCardBody className="p-4 p-md-5 text-center">
            <MDBTypography tag="h1" className="h3 fw-bold mb-3">
              Simulation is still in progress
            </MDBTypography>
            <p className="text-muted mb-4">
              Finish the simulation first to see the final summary page.
            </p>
            <MDBBtn
            
              onClick={() => navigate(`/game/${parsedSimulationId}/stocks-view`)}
              className="rounded-pill px-4"
            >
              Continue game
            </MDBBtn>
          </MDBCardBody>
        </MDBCard>
      </MDBContainer>
    );
  }

  const initialBalance = gameState.initialBalance ?? 0;
  const currentBalance = gameState.currentBalance ?? 0;
  const availableFunds = gameState.availableFunds ?? 0;
  const profitLoss = gameState.profitLoss ?? currentBalance - initialBalance;
  const profitLossPercent =
    initialBalance === 0 ? 0 : (profitLoss / initialBalance) * 100;
  const totalShares = openPositions.reduce(
    (total, position) => total + position.amount,
    0,
  );
  const investedValue = openPositions.reduce(
    (total, position) => total + position.amount * position.currentPrice,
    0,
  );
  const profitLossClass = profitLoss >= 0 ? 'text-price-up' : 'text-price-down';

  return (
    <MDBContainer className="summary-page py-4 py-md-5">
      <div className="summary-page__panel border rounded-4 mx-auto">
        <div className="summary-page__hero d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-4 mb-4">
          <div className="d-flex align-items-start gap-3">
            <div className="summary-page__hero-icon">
              <MDBIcon fas icon="flag-checkered" />
            </div>
            <div>
              <p className="summary-page__eyebrow mb-2">Simulation finished</p>
              <h2 className="mb-2">Game summary</h2>
              <p className="text-muted mb-0">
                Final results for simulation #{parsedSimulationId}
              </p>
            </div>
          </div>

          <div className="summary-page__badge rounded-pill px-3 py-2 fw-bold">
            Completed
          </div>
        </div>

        <MDBRow className="g-3 mb-3">
          <MDBCol size="12" md="6" xl="3">
            <SummaryMetric
              icon="wallet"
              label="Final balance"
              value={formatCurrency(currentBalance)}
            />
          </MDBCol>
          <MDBCol size="12" md="6" xl="3">
            <SummaryMetric
              icon="chart-line"
              label="Profit / Loss"
              value={`${profitLoss >= 0 ? '+' : '-'}${formatCurrency(
                Math.abs(profitLoss),
              )}`}
              valueClassName={profitLossClass}
            />
          </MDBCol>
          <MDBCol size="12" md="6" xl="3">
            <SummaryMetric
              icon="percent"
              label="Return"
              value={`${profitLossPercent >= 0 ? '+' : '-'}${percentFormatter.format(
                Math.abs(profitLossPercent),
              )}%`}
              valueClassName={profitLossClass}
            />
          </MDBCol>
          <MDBCol size="12" md="6" xl="3">
            <SummaryMetric
              icon="money-bill-wave"
              label="Available funds"
              value={formatCurrency(availableFunds)}
            />
          </MDBCol>
        </MDBRow>

        <MDBRow className="g-3 mb-3">
          <MDBCol size="12" xl="6">
            <MDBCard className="summary-page__info-card border rounded-3 h-100">
              <MDBCardBody className="p-3">
                <MDBTypography tag="h5" className="fw-bold mb-3">
                  Session details
                </MDBTypography>
                <div className="d-flex flex-column gap-2 text-muted">
                  <div className="d-flex justify-content-between gap-3">
                    <span>Period</span>
                    <span className="text-white">
                      {formatDateOnly(gameState.startDate)} —{' '}
                      {formatDateOnly(gameState.finishDate)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between gap-3">
                    <span>Finished at</span>
                    <span className="text-white">
                      {formatDateTime(gameState.finishedAt)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between gap-3">
                    <span>Initial balance</span>
                    <span className="text-white">
                      {formatCurrency(initialBalance)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between gap-3">
                    <span>Positions value</span>
                    <span className="text-white">
                      {formatCurrency(investedValue)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between gap-3">
                    <span>Open positions</span>
                    <span className="text-white">{openPositions.length}</span>
                  </div>
                  <div className="d-flex justify-content-between gap-3">
                    <span>Total shares</span>
                    <span className="text-white">
                      {percentFormatter.format(totalShares)}
                    </span>
                  </div>
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>

          <MDBCol size="12" xl="6">
            <MDBCard className="summary-page__info-card border rounded-3 h-100">
              <MDBCardBody className="p-3">
                <MDBTypography tag="h5" className="fw-bold mb-3">
                  Top positions
                </MDBTypography>
                {topPositions.length === 0 ? (
                  <p className="text-muted mb-0">
                    No open positions at the end of this simulation.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {topPositions.map((position) => (
                      <div
                        key={position.ticker}
                        className="summary-page__position-row d-flex align-items-center justify-content-between gap-3 rounded-3 px-3 py-2"
                      >
                        <div className="d-flex flex-column">
                          <span className="fw-bold">{position.ticker}</span>
                          <span className="small text-muted">
                            {position.companyName}
                          </span>
                        </div>
                        <div className="text-end">
                          <div className="fw-semibold">
                            {formatCurrency(position.marketValue)}
                          </div>
                          <div
                            className={`small ${
                              position.changePercent >= 0
                                ? 'text-price-up'
                                : 'text-price-down'
                            }`}
                          >
                            {position.changePercent >= 0 ? '+' : ''}
                            {percentFormatter.format(position.changePercent)}% •{' '}
                            {percentFormatter.format(position.shares)} sh
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>

        <div className="d-flex flex-column flex-md-row gap-3 justify-content-end">
          <MDBBtn
            type="button"
            color="light"
            outline
            className="summary-page__action-btn"
            onClick={() => navigate('/')}
          >
            <MDBIcon fas icon="house" className="me-2" />
            Back home
          </MDBBtn>
          <MDBBtn
            type="button"
            className="summary-page__action-btn summary-page__action-btn--primary"
            onClick={() => navigate('/game-params')}
          >
            <MDBIcon fas icon="plus" className="me-2" />
            New game
          </MDBBtn>
        </div>
      </div>
    </MDBContainer>
  );
}
