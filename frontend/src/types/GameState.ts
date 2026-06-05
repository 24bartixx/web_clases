import type { Price } from './Price';
import type { StockPosition } from './StockPosition';

export type GameStatus = 'idle' | 'creating' | 'loading' | 'ready' | 'error';

export type GameState = {
  simulationId: number | null;
  status: GameStatus;
  initialBalance: number | null;
  currentBalance: number | null;
  startDate: string | null;
  currentDate: string | null;
  finishDate: string | null;
  stockPositions: StockPosition[] | null;
  pricesByStockId: Record<number, Price[]>;
  error: string | null;
};

export const initialGameState: GameState = {
  simulationId: null,
  status: 'idle',
  initialBalance: null,
  currentBalance: null,
  startDate: null,
  currentDate: null,
  finishDate: null,
  stockPositions: null,
  pricesByStockId: {},
  error: null,
};
