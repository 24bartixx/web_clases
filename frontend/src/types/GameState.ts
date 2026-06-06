import type { Price } from './Price';
import type { StockPosition } from './StockPosition';

export type GameStatus = 'idle' | 'creating' | 'loading' | 'ready' | 'error';

export type GameState = {
  simulationId: number | null;
  status: GameStatus;
  initialBalance: number | null;
  currentBalance: number | null;
  availableFunds: number | null;
  profitLoss: number | null;
  startDate: string | null;
  currentDate: string | null;
  finishDate: string | null;
  tradingDates: string[];
  stockPositions: StockPosition[] | null;
  pricesByStockId: Record<number, Price[]>;
  error: string | null;
};

export const initialGameState: GameState = {
  simulationId: null,
  status: 'idle',
  initialBalance: null,
  currentBalance: null,
  availableFunds: null,
  profitLoss: null,
  startDate: null,
  currentDate: null,
  finishDate: null,
  tradingDates: [],
  stockPositions: null,
  pricesByStockId: {},
  error: null,
};
