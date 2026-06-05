import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { GameState, initialGameState } from '../types/GameState';
import { mapSimulationDetailToGameState } from '../mappers/simulationMapper';
import { createTransaction } from '../api/transactionsApi';
import {
  createSimulation,
  getSimulation,
  updateSimulationCurrentDate,
} from '../api/simulationApi';

interface GameContextType {
  gameState: GameState;
  createGame: (params: CreateGameParams) => Promise<void>;
  makeTransaction: (params: MakeTransactionParams) => Promise<void>;
  advanceTurn: (days: number) => Promise<void>;
}

interface CreateGameParams {
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

const parseDateOnly = (dateValue: string) => {
  const [year, month, day] = dateValue.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toDateOnlyString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create game';

      console.error('Failed to create game', error);
      setGameState((currentGameState) => ({
        ...currentGameState,
        status: 'error',
        error: errorMessage,
      }));
    }
  };

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

      setGameState((currentGameState) => ({
        ...updatedGameState,
        pricesByStockId: currentGameState.pricesByStockId,
      }));
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
    const currentDate = gameState.currentDate ?? gameState.startDate;

    if (simulationId === null || currentDate === null) {
      setGameState((currentGameState) => ({
        ...currentGameState,
        status: 'error',
        error: 'Cannot advance turn before game is created',
      }));
      return;
    }

    const daysToAdvance = Math.max(1, Math.trunc(days));
    const nextDate = parseDateOnly(currentDate);
    nextDate.setDate(nextDate.getDate() + daysToAdvance);

    if (gameState.finishDate !== null) {
      const finishDate = parseDateOnly(gameState.finishDate);
      if (nextDate > finishDate) {
        nextDate.setTime(finishDate.getTime());
      }
    }

    setGameState((currentGameState) => ({
      ...currentGameState,
      status: 'loading',
      error: null,
    }));

    try {
      await updateSimulationCurrentDate(simulationId, toDateOnlyString(nextDate));

      const simulation = await getSimulation(simulationId);
      const updatedGameState = mapSimulationDetailToGameState(simulation);

      setGameState((currentGameState) => ({
        ...updatedGameState,
        pricesByStockId: currentGameState.pricesByStockId,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to advance turn';

      console.error('Failed to advance turn', error);
      setGameState((currentGameState) => ({
        ...currentGameState,
        status: 'error',
        error: errorMessage,
      }));
    }
  };

  return (
    <GameContext.Provider
      value={{ gameState, createGame, makeTransaction, advanceTurn }}
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
