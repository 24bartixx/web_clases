import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { GameState, initialGameState } from '../types/GameState';
import { mapSimulationDetailToGameState } from '../mappers/simulationMapper';
import type { SimulationDetailResponse } from '../mappers/simulationMapper';
import { createTransaction } from '../api/transactionsApi';
import {
  advanceSimulationTurn,
  createSimulation,
  getSimulation,
} from '../api/simulationApi';

interface GameContextType {
  gameState: GameState;
  createGame: (params: CreateGameParams) => Promise<SimulationDetailResponse>;
  resumeGame: (simulationId: number) => Promise<void>;
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

    if (simulationId === null) {
      setGameState((currentGameState) => ({
        ...currentGameState,
        status: 'error',
        error: 'Cannot advance turn before game is created',
      }));
      return;
    }

    const daysToAdvance = Math.max(1, Math.trunc(days));

    setGameState((currentGameState) => ({
      ...currentGameState,
      status: 'loading',
      error: null,
    }));

    try {
      const simulation = await advanceSimulationTurn(simulationId, daysToAdvance);
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
      value={{ gameState, createGame, resumeGame, makeTransaction, advanceTurn }}
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
