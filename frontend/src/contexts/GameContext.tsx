import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { GameState, initialGameState } from '../types/GameState';

interface GameContextType {
  gameState: GameState;
  createGame: (
    startingBudget: number,
    companiesTickets: string[],
    startDate: string,
    finishDate: string,
  ) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const createGame = (
    startingBudget: number,
    companiesTickets: string[],
    startDate: string,
    finishDate: string,
  ) => {
    // TODO: call to create game
    // TODO: update gameState based on response
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
