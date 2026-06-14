import { act, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { MDBTypography } from 'mdb-react-ui-kit';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const { gameState, advanceTurn, finishGame } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const [daysToAdvance, setDaysToAdvance] = useState(1);
  const isAdvancingRef = useRef(false);
  const [isAdvancingTurn, setIsAdvancingTurn] = useState(false);

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
  const remainingTradingDates = useMemo(() => {
    if (gameState.currentDate === null) {
      return [];
    }

    const currentDate = gameState.currentDate.slice(0, 10);

    return gameState.tradingDates.filter((tradingDate) => {
      if (tradingDate <= currentDate) {
        return false;
      }

      if (gameState.finishDate === null) {
        return true;
      }

      return tradingDate <= gameState.finishDate.slice(0, 10);
    });
  }, [gameState.currentDate, gameState.finishDate, gameState.tradingDates]);
  const remainingTradingDateCount = remainingTradingDates.length;
  const maxDaysToAdvance =
    gameState.currentDate !== null ? remainingTradingDateCount + 1 : 0;
  const canAdvance = isGameReady && maxDaysToAdvance > 0;
  const isLoadingData = isAdvancingTurn;
  const isFinishSelected = canAdvance && daysToAdvance >= maxDaysToAdvance;
  const profitLossClass =
    profitLoss === null || profitLoss >= 0
      ? 'text-price-up'
      : 'text-price-down';
  const displayedDate = gameState.currentDate ?? gameState.startDate;
  const nextRoundLabel = useMemo(() => {
    if (maxDaysToAdvance === 0) {
      return '--';
    }

    const daysToSkip = Math.min(
      remainingTradingDateCount,
      Math.max(1, Math.trunc(daysToAdvance)),
    );
    const targetTradingDate = remainingTradingDates[daysToSkip - 1];

    if (targetTradingDate === undefined) {
      return '--';
    }

    return formatDate(targetTradingDate);
  }, [
    daysToAdvance,
    maxDaysToAdvance,
    remainingTradingDateCount,
    remainingTradingDates,
  ]);

  useEffect(() => {
    if (maxDaysToAdvance === 0) {
      return;
    }

    setDaysToAdvance((currentDaysToAdvance) =>
      Math.min(maxDaysToAdvance, Math.max(1, Math.trunc(currentDaysToAdvance))),
    );
  }, [maxDaysToAdvance]);

  const handleNextTurn = async () => {
    if (!canAdvance || isAdvancingRef.current || isAdvancingTurn) {
      return;
    }

    isAdvancingRef.current = true;
    setIsAdvancingTurn(true);

    try {
      if (isFinishSelected && gameState.simulationId !== null) {
        await finishGame();
        navigate(`/game/${gameState.simulationId}/summary`);
        return;
      }

      await advanceTurn(Math.min(daysToAdvance, maxDaysToAdvance));
    } finally {
      isAdvancingRef.current = false;
      setIsAdvancingTurn(false);
    }
  };

  const handleDaysChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);

    if (!Number.isFinite(value)) {
      setDaysToAdvance(1);
      return;
    }

    const normalizedValue = Math.max(1, Math.trunc(value));
    const clampedValue =
      maxDaysToAdvance > 0
        ? Math.min(maxDaysToAdvance, normalizedValue)
        : normalizedValue;

    setDaysToAdvance(clampedValue);
  };

  const isStocksView = location.pathname.includes('/stocks-view');
  const isPortfolio = location.pathname.includes('/portfolio');

  return (
    <header className="sticky top-0 z-50 shadow-sm border-bottom bg-body">
      <div className="container py-3">
        <div className="gap-3 d-flex flex-column flex-xl-row align-items-stretch align-items-xl-center justify-content-between">
          <button
            type="button"
            className="gap-4 p-0 bg-transparent border-0 d-flex align-items-center text-start text-reset"
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
              <MDBTypography tag="h1" className="mb-0 fs-4 fw-bold">
                Chess Bross Trading
              </MDBTypography>
              <MDBTypography tag="p" className="mb-0 small text-muted">
                {isGameReady ? 'Trading session' : 'No active game'}
              </MDBTypography>
            </div>
          </button>

          {isGameReady && (
            <div
              className="gap-4 d-flex justify-content-center mx-xl-4"
              style={{ margin: '0 auto' }}
            >
              <button
                type="button"
                className={`bg-transparent border-0 p-0 d-flex flex-row align-items-center gap-1.5 shadow-none ${isStocksView ? 'text-white opacity-100' : 'text-muted opacity-60'}`}
                onClick={() =>
                  navigate(`/game/${gameState.simulationId}/stocks-view`)
                }
                style={{ transition: 'color 0.2s' }}
                onMouseEnter={(e) => {
                  if (!isStocksView)
                    e.currentTarget.classList.replace(
                      'text-muted',
                      'text-white',
                    );
                }}
                onMouseLeave={(e) => {
                  if (!isStocksView)
                    e.currentTarget.classList.replace(
                      'text-white',
                      'text-muted',
                    );
                }}
              >
                <div>
                  <MDBTypography
                    tag="p"
                    className={`p-0 m-0 fs-5 ${isStocksView ? 'fw-semibold' : 'fw-normal'}`}
                  >
                    Stock List
                  </MDBTypography>
                </div>
              </button>
              <button
                type="button"
                className={`bg-transparent border-0 p-0 d-flex flex-row align-items-center gap-1.5 shadow-none ${isPortfolio ? 'text-white opacity-100' : 'text-muted opacity-60'}`}
                onClick={() =>
                  navigate(`/game/${gameState.simulationId}/portfolio`)
                }
                style={{ transition: 'color 0.2s' }}
                onMouseEnter={(e) => {
                  if (!isPortfolio)
                    e.currentTarget.classList.replace(
                      'text-muted',
                      'text-white',
                    );
                }}
                onMouseLeave={(e) => {
                  if (!isPortfolio)
                    e.currentTarget.classList.replace(
                      'text-white',
                      'text-muted',
                    );
                }}
              >
                <div>
                  <MDBTypography
                    tag="p"
                    className={`p-0 m-0 fs-5 ${isPortfolio ? 'fw-semibold' : 'fw-normal'}`}
                  >
                    Portfolio
                  </MDBTypography>
                </div>
              </button>
            </div>
          )}

          <div className="gap-4 d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center">
            <div className="flex flex-col min-w-[320px] gap-2">
              {/* Acccount balance */}
              <MDBTypography
                tag="p"
                className="mb-0 text-center text-[1.4rem] font-normal leading-[1.1] text-white"
              >
                {formatCurrency(accountBalance)}
              </MDBTypography>

              <div className="flex-wrap gap-4 mr-2 d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <MDBTypography tag="p" className="mb-1 small text-muted">
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
                  <MDBTypography tag="p" className="mb-1 small text-muted">
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

            <div className="px-3 py-2 border rounded-3">
              <div className="gap-3 d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <MDBTypography tag="p" className="mb-1 small text-muted">
                      Current date
                    </MDBTypography>
                    <MDBTypography tag="p" className="mb-0 fw-semibold">
                      {formatDate(displayedDate)}
                    </MDBTypography>
                  </div>
                  <div className="text-end">
                    <MDBTypography tag="p" className="mb-1 small text-muted">
                      Next round
                    </MDBTypography>
                    <MDBTypography tag="p" className="mb-0 fw-semibold">
                      {nextRoundLabel}
                    </MDBTypography>
                  </div>
                </div>

                <div className="gap-2 d-flex align-items-center">
                  <input
                    id="next-turn-days"
                    type="number"
                    min={1}
                    max={maxDaysToAdvance || 1}
                    step={1}
                    value={daysToAdvance}
                    onChange={handleDaysChange}
                    className="text-center form-control form-control-sm"
                    style={{ width: 64 }}
                    disabled={!canAdvance}
                  />
                  <span className="pr-4 small text-muted">days</span>
                  <button
                    type="button"
                    className="ms-auto inline-flex h-[30px] min-w-[100px] items-center justify-center gap-2 rounded-md border border-white/40 bg-white/[0.03] px-2 py-0 text-sm font-medium text-gray-100 transition hover:border-white/70 hover:bg-white/10 disabled:border-gray-600 disabled:text-gray-500 disabled:opacity-70"
                    onClick={handleNextTurn}
                    disabled={!canAdvance || isLoadingData}
                  >
                    {isLoadingData ? (
                      <span
                        aria-hidden="true"
                        className="text-white spinner-border spinner-border-sm"
                        role="status"
                      />
                    ) : (
                      <>
                        <span>{isFinishSelected ? 'Finish' : 'Next'}</span>
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
                      </>
                    )}
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
