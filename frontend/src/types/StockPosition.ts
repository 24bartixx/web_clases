import { Price } from './Price';
import { Stock } from './Stock';
import { Transaction } from './Transaction';

export type StockPosition = {
  positionId: number;
  stockId: number;
  stock: Stock;
  amount: number;
  transactions: Transaction[];
  prices: Price[];
};
