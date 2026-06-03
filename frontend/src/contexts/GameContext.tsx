import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { GameState, initialGameState } from '../types/GameState';
import { apiUrl } from '../config/api';
import { auth_fetch } from '../utils/auth_fetch';
import { mapSimulationDetailToGameState } from '../mappers/simulationMapper';
import type { SimulationDetailResponse } from '../mappers/simulationMapper';

interface GameContextType {
  gameState: GameState;
  createGame: (params: CreateGameParams) => Promise<void>;
}

interface CreateGameParams {
  startingBudget: number;
  companiesTickers: string[];
  startDate: string;
  finishDate: string;
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
      const response = await auth_fetch(apiUrl('/simulation/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initial_balance: params.startingBudget,
          start_date: params.startDate || null,
          finish_date: params.finishDate || null,
          stock_ids: [624, 794, 892, 923, 664],
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error('Failed to create game', errorMessage);
        setGameState((currentGameState) => ({
          ...currentGameState,
          status: 'error',
          error: errorMessage || 'Failed to create game',
        }));
        return;
      }

      const data = (await response.json()) as SimulationDetailResponse;
      console.log('Created game', data);
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

  return (
    <GameContext.Provider value={{ gameState, createGame }}>
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
