import { StockPosition } from './StockPosition';

export type GameStatus = 'idle' | 'creating' | 'loading' | 'ready' | 'error';

export type GameState = {
  simulationId: number | null;
  status: GameStatus;
  currentBalance: number | null;
  startDate: string | null;
  finishDate: string | null;
  stockPositions: StockPosition[] | null;
  error: string | null;
};

export const initialGameState: GameState = {
  simulationId: null,
  status: 'idle',
  currentBalance: null,
  startDate: null,
  finishDate: null,
  stockPositions: null,
  error: null,
};