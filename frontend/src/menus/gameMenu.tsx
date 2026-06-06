import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { MDBTypography } from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import nextIcon from '../assets/next.svg';
import { useGame } from '../contexts/GameContext';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const formatCurrency = (value: number | null) =>
  value === null ? '--' : currencyFormatter.format(value);

const parseDateOnly = (dateValue: string) => {
  const [year, month, day] = dateValue.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (dateValue: string | null) => {
  if (dateValue === null) {
    return '--';
  }

  const date = parseDateOnly(dateValue);
  return Number.isNaN(date.getTime()) ? '--' : dateFormatter.format(date);
};

export function GameMenu() {
  const { gameState, advanceTurn } = useGame();
  const navigate = useNavigate();
  const [daysToAdvance, setDaysToAdvance] = useState(1);
  const isAdvancingRef = useRef(false);

  const availableFunds = gameState.availableFunds;
  const accountBalance = gameState.currentBalance;
  const profitLoss = gameState.profitLoss;
  const profitLossPercent =
    profitLoss === null ||
    gameState.initialBalance === null ||
    gameState.initialBalance === 0
      ? null
      : (profitLoss / gameState.initialBalance) * 100;

  const isGameReady = gameState.simulationId !== null;
  const isAtFinish =
    gameState.currentDate !== null &&
    gameState.finishDate !== null &&
    parseDateOnly(gameState.currentDate) >= parseDateOnly(gameState.finishDate);
  const canAdvance = isGameReady && !isAtFinish;
  const profitLossClass =
    profitLoss === null || profitLoss >= 0
      ? 'text-price-up'
      : 'text-price-down';
  const displayedDate = gameState.currentDate ?? gameState.startDate;
  const nextRoundLabel = useMemo(() => {
    if (gameState.currentDate === null) {
      return '--';
    }

    const currentDate = gameState.currentDate.slice(0, 10);
    const tradingDates = gameState.tradingDates.filter(
      (tradingDate) => tradingDate > currentDate,
    );
    const daysToSkip = Math.max(1, Math.trunc(daysToAdvance));
    const targetTradingDate = tradingDates[daysToSkip - 1];

    if (targetTradingDate === undefined) {
      return '--';
    }

    return formatDate(targetTradingDate);
  }, [daysToAdvance, gameState.currentDate, gameState.tradingDates]);

  const handleNextTurn = async () => {
    if (!canAdvance || isAdvancingRef.current) {
      return;
    }

    isAdvancingRef.current = true;

    try {
      await advanceTurn(daysToAdvance);
    } finally {
      isAdvancingRef.current = false;
    }
  };

  const handleDaysChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);

    setDaysToAdvance(Number.isFinite(value) ? Math.max(1, value) : 1);
  };

  return (
    <header className="border-bottom shadow-sm">
      <div className="container py-3">
        <div className="d-flex flex-column flex-xl-row align-items-stretch align-items-xl-center justify-content-between gap-3">
          <button
            type="button"
            className="d-flex align-items-center gap-4 border-0 bg-transparent p-0 text-start text-reset"
            onClick={() => navigate('/')}
          >
            <img
              src={logo}
              alt="Chess Bross Trading logo"
              width={48}
              height={48}
              className="rounded-circle object-fit-cover"
            />
            <div>
              <MDBTypography tag="h1" className="fs-4 fw-bold mb-0">
                Chess Bross Trading
              </MDBTypography>
              <MDBTypography tag="p" className="small text-muted mb-0">
                {isGameReady ? 'Trading session' : 'No active game'}
              </MDBTypography>
            </div>
          </button>

          <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-4">
            <div className="flex flex-col min-w-[320px] gap-2">
              {/* Acccount balance */}
              <MDBTypography
                tag="p"
                className="mb-0 text-center text-[1.4rem] font-normal leading-[1.1] text-white"
              >
                {formatCurrency(accountBalance)}
              </MDBTypography>

              <div className="d-flex flex-wrap align-items-center justify-content-center gap-4 mr-2">
                <div className="text-center">
                  <MDBTypography tag="p" className="small text-muted mb-1">
                    Available funds
                  </MDBTypography>
                  <MDBTypography
                    tag="p"
                    className="mb-0 text-[1.05rem] font-normal leading-tight"
                  >
                    {formatCurrency(availableFunds)}
                  </MDBTypography>
                </div>

                <div className="text-center">
                  <MDBTypography tag="p" className="small text-muted mb-1">
                    Profit / Loss
                  </MDBTypography>
                  <MDBTypography
                    tag="p"
                    className={`mb-0 text-[1.05rem] font-normal leading-tight ${profitLossClass}`}
                  >
                    {profitLoss === null
                      ? '--'
                      : `${profitLoss >= 0 ? '+' : '-'}${formatCurrency(Math.abs(profitLoss))}`}
                    {profitLossPercent !== null &&
                      ` (${profitLossPercent >= 0 ? '+' : '-'}${Math.abs(profitLossPercent).toFixed(2)}%)`}
                  </MDBTypography>
                </div>
              </div>
            </div>

            <div className="border rounded-3 px-3 py-2">
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <MDBTypography tag="p" className="small text-muted mb-1">
                      Current date
                    </MDBTypography>
                    <MDBTypography tag="p" className="fw-semibold mb-0">
                      {formatDate(displayedDate)}
                    </MDBTypography>
                  </div>
                  <div className="text-end">
                    <MDBTypography tag="p" className="small text-muted mb-1">
                      Next round
                    </MDBTypography>
                    <MDBTypography tag="p" className="fw-semibold mb-0">
                      {nextRoundLabel}
                    </MDBTypography>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <input
                    id="next-turn-days"
                    type="number"
                    min={1}
                    step={1}
                    value={daysToAdvance}
                    onChange={handleDaysChange}
                    className="form-control form-control-sm text-center"
                    style={{ width: 64 }}
                    disabled={!isGameReady}
                  />
                  <span className="small text-muted pr-4">days</span>
                  <button
                    type="button"
                    className="ms-auto inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/[0.03] px-3 py-1 text-sm font-medium text-gray-100 transition hover:border-white/70 hover:bg-white/10 disabled:border-gray-600 disabled:text-gray-500 disabled:opacity-70"
                    onClick={handleNextTurn}
                    disabled={!canAdvance}
                  >
                    <span>Next</span>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 15,
                        height: 15,
                        backgroundColor: 'currentColor',
                        display: 'inline-block',
                        WebkitMask: `url(${nextIcon}) center / contain no-repeat`,
                        mask: `url(${nextIcon}) center / contain no-repeat`,
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
