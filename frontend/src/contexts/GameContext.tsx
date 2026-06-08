import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { GameState, initialGameState } from '../types/GameState';
import { mapSimulationDetailToGameState } from '../mappers/simulationMapper';
import type { SimulationDetailResponse } from '../mappers/simulationMapper';
import { createTransaction } from '../api/transactionsApi';
import {
  advanceSimulationTurn,
  createSimulation,
  finishSimulation,
  getSimulation,
} from '../api/simulationApi';
import { apiUrl } from '../config/api';
import type { PriceDto } from '../types';

interface GameContextType {
  gameState: GameState;
  createGame: (params: CreateGameParams) => Promise<SimulationDetailResponse>;
  resumeGame: (simulationId: number) => Promise<void>;
  makeTransaction: (params: MakeTransactionParams) => Promise<void>;
  advanceTurn: (days: number) => Promise<void>;
  finishGame: () => Promise<void>;
}

interface CreateGameParams {
  simulationName: string;
  startingBudget: number;
  stockIds: number[];
  startDate: string;
  finishDate: string;
}

interface MakeTransactionParams {
  stockId: number;
  transactionType: 'buy' | 'sell';
  transactionTime: string;
  price: number;
  amount: number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const toDateOnly = (dateValue: string | null) =>
  dateValue?.slice(0, 10) ?? null;

const addDaysToDateOnly = (dateValue: string, days: number) => {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getDate()).padStart(2, '0');

  return `${nextYear}-${nextMonth}-${nextDay}`;
};

const getTargetTradingDate = (gameState: GameState, daysToAdvance: number) => {
  const currentDate = toDateOnly(gameState.currentDate);

  if (currentDate === null) {
    return null;
  }

  const remainingTradingDates = gameState.tradingDates.filter((tradingDate) => {
    if (tradingDate <= currentDate) {
      return false;
    }

    if (gameState.finishDate === null) {
      return true;
    }

    return tradingDate <= gameState.finishDate.slice(0, 10);
  });

  return remainingTradingDates[daysToAdvance - 1] ?? null;
};

const fetchOpenPriceForDate = async (ticker: string, date: string) => {
  const finishDate = addDaysToDateOnly(date, 1);
  const response = await fetch(
    apiUrl(
      `/stocks/${ticker}/prices?start=${date}&finish=${finishDate}&interval=1d`,
    ),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch price for ${ticker} on ${date}`);
  }

  const prices: PriceDto[] = await response.json();
  const targetPrice = prices.find(
    (price) => toDateOnly(price.price_date) === date,
  );

  if (targetPrice === undefined) {
    throw new Error(`Missing price for ${ticker} on ${date}`);
  }

  return Number(targetPrice.open);
};

const calculateEstimatedFinancials = async (
  gameState: GameState,
  targetTradingDate: string,
) => {
  const stockPositions = gameState.stockPositions;

  if (
    stockPositions === null ||
    gameState.availableFunds === null ||
    gameState.initialBalance === null
  ) {
    return null;
  }

  const openPositions = stockPositions.filter(
    (position) => position.amount > 0,
  );
  const openPrices = await Promise.all(
    openPositions.map(async (position) => ({
      price: await fetchOpenPriceForDate(
        position.stock.ticker,
        targetTradingDate,
      ),
      stockId: position.stockId,
    })),
  );
  const openPricesByStockId = new Map(
    openPrices.map(({ price, stockId }) => [stockId, price]),
  );

  const updatedStockPositions = stockPositions.map((position) => {
    const currentPrice = openPricesByStockId.get(position.stockId);

    if (currentPrice === undefined) {
      return position;
    }

    const previousPrice = position.currentPrice;
    const priceChange = currentPrice - previousPrice;

    return {
      ...position,
      currentPrice,
      previousPrice,
      priceChange,
      priceChangePercent:
        previousPrice === 0 ? 0 : (priceChange / previousPrice) * 100,
    };
  });
  const positionsValue = updatedStockPositions.reduce(
    (total, position) =>
      position.amount > 0
        ? total + position.amount * position.currentPrice
        : total,
    0,
  );
  const currentBalance = gameState.availableFunds + positionsValue;

  return {
    availableFunds: gameState.availableFunds,
    currentBalance,
    profitLoss: currentBalance - gameState.initialBalance,
    stockPositions: updatedStockPositions,
  };
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const createGame = async (params: CreateGameParams) => {
    console.log('createGame', params);

    setGameState((currentGameState) => ({
      ...currentGameState,
      status: 'creating',
      error: null,
    }));

    try {
      const data = await createSimulation(params);
      setGameState(mapSimulationDetailToGameState(data));
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create game';

      console.error('Failed to create game', error);
      setGameState((currentGameState) => ({
        ...currentGameState,
        status: 'error',
        error: errorMessage,
      }));
      throw error;
    }
  };

  const resumeGame = useCallback(async (simulationId: number) => {
    setGameState((currentGameState) => ({
      ...currentGameState,
      status: 'loading',
      error: null,
    }));

    try {
      const simulation = await getSimulation(simulationId);
      setGameState(mapSimulationDetailToGameState(simulation));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to resume game';

      console.error('Failed to resume game', error);
      setGameState((currentGameState) => ({
        ...currentGameState,
        status: 'error',
        error: errorMessage,
      }));
    }
  }, []);

  const makeTransaction = async (params: MakeTransactionParams) => {
    const simulationId = gameState.simulationId;

    if (simulationId === null) {
      setGameState((currentGameState) => ({
        ...currentGameState,
        status: 'error',
        error: 'Cannot create transaction before game is created',
      }));
      return;
    }

    setGameState((currentGameState) => ({
      ...currentGameState,
      status: 'loading',
      error: null,
    }));

    try {
      await createTransaction({
        simulationId,
        stockId: params.stockId,
        transactionType: params.transactionType,
        transactionTime: params.transactionTime,
        price: params.price,
        amount: params.amount,
      });

      const simulation = await getSimulation(simulationId);
      const updatedGameState = mapSimulationDetailToGameState(simulation);

      setGameState(updatedGameState);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create transaction';

      console.error('Failed to create transaction', error);
      setGameState((currentGameState) => ({
        ...currentGameState,
        status: 'error',
        error: errorMessage,
      }));
    }
  };

  const advanceTurn = async (days: number) => {
    const simulationId = gameState.simulationId;

    if (simulationId === null) {
      setGameState((currentGameState) => ({
        ...currentGameState,
        status: 'error',
        error: 'Cannot advance turn before game is created',
      }));
      return;
    }

    const daysToAdvance = Math.max(1, Math.trunc(days));
    const previousGameState = gameState;
    const targetTradingDate = getTargetTradingDate(gameState, daysToAdvance);

    setGameState((currentGameState) => ({
      ...currentGameState,
      currentDate:
        targetTradingDate === null
          ? currentGameState.currentDate
          : `${targetTradingDate}T00:00:00`,
      error: null,
    }));

    let canApplyEstimate = true;

    if (targetTradingDate !== null) {
      void calculateEstimatedFinancials(gameState, targetTradingDate)
        .then((estimatedFinancials) => {
          if (!canApplyEstimate || estimatedFinancials === null) {
            return;
          }

          setGameState((currentGameState) => ({
            ...currentGameState,
            availableFunds: estimatedFinancials.availableFunds,
            currentBalance: estimatedFinancials.currentBalance,
            profitLoss: estimatedFinancials.profitLoss,
            stockPositions: estimatedFinancials.stockPositions,
          }));
        })
        .catch((error) => {
          console.error('Failed to estimate financials', error);
        });
    }

    try {
      const simulation = await advanceSimulationTurn(
        simulationId,
        daysToAdvance,
      );
      canApplyEstimate = false;
      const updatedGameState = mapSimulationDetailToGameState(simulation);

      setGameState(updatedGameState);
    } catch (error) {
      canApplyEstimate = false;
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to advance turn';

      console.error('Failed to advance turn', error);
      setGameState((currentGameState) => ({
        ...currentGameState,
        availableFunds: previousGameState.availableFunds,
        currentBalance: previousGameState.currentBalance,
        currentDate: previousGameState.currentDate,
        profitLoss: previousGameState.profitLoss,
        stockPositions: previousGameState.stockPositions,
        status: 'error',
        error: errorMessage,
      }));
    }
  };

  const finishGame = async () => {
    const simulationId = gameState.simulationId;

    if (simulationId === null) {
      setGameState((currentGameState) => ({
        ...currentGameState,
        status: 'error',
        error: 'Cannot finish game before game is created',
      }));
      return;
    }

    try {
      await finishSimulation(simulationId, new Date().toISOString());
      const simulation = await getSimulation(simulationId);
      const updatedGameState = mapSimulationDetailToGameState(simulation);

      setGameState(updatedGameState);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to finish game';

      console.error('Failed to finish game', error);
      setGameState((currentGameState) => ({
        ...currentGameState,
        status: 'error',
        error: errorMessage,
      }));

      throw error;
    }
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        createGame,
        resumeGame,
        makeTransaction,
        advanceTurn,
        finishGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);

  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }

  return context;
}
