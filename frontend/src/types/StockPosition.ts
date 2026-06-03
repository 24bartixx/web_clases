import type { Stock } from './Stock';
import type { Transaction } from './Transaction';

export type StockPosition = {
  positionId: number;
  stockId: number;
  stock: Stock;
  amount: number;
  transactions: Transaction[];
};
