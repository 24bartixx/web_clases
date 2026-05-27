import { Price } from './Price';
import { Transaction } from './Transaction';

export type StockPosition = {
  positionId: number;
  amount: number;
  transactions: Transaction[];
  prices: Price[];
};
