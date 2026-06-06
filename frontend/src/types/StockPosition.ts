import type { Stock, StockDetails } from './Stock';
import type { Transaction } from './Transaction';

export type StockPosition = {
  positionId: number;
  stockId: number;
  stock: Stock & StockDetails;
  amount: number;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  transactions: Transaction[];
};
