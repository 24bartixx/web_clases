import type { GameState } from '../types/GameState';

type NumericResponseValue = number | string;

interface SimulationStockResponse {
  stock_id: number;
  ticker: string;
  company_name: string | null;
  sector: string | null;
  industry: string | null;
  description: string | null;
  sharesOutstanding: number | null;
  floatShares: number | null;
  country: string | null;
  currency: string | null;
  website: string | null;
}

interface SimulationPositionResponse {
  position_id: number;
  stock_id: number;
  amount: NumericResponseValue;
  current_price: NumericResponseValue | null;
  previous_price: NumericResponseValue | null;
  price_change: NumericResponseValue | null;
  price_change_percent: NumericResponseValue | null;
  volume: NumericResponseValue | null;
  stock: SimulationStockResponse;
}

interface SimulationTransactionResponse {
  transaction_id: number;
  transaction_time: string;
  transaction_type: 'buy' | 'sell';
  price: NumericResponseValue;
  amount: NumericResponseValue;
  stock_id: number;
  created_at: string;
  stock: SimulationStockResponse;
}

export interface SimulationDetailResponse {
  simulation_id: number;
  initial_balance: NumericResponseValue;
  current_balance: NumericResponseValue;
  available_funds: NumericResponseValue;
  profit_loss: NumericResponseValue;
  start_date: string;
  current_date: string;
  finish_date: string | null;
  finished_at: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  trading_dates: string[];
  positions: SimulationPositionResponse[];
  transactions: SimulationTransactionResponse[];
}

export const mapSimulationDetailToGameState = (
  simulation: SimulationDetailResponse,
): GameState => ({
  simulationId: simulation.simulation_id,
  status: 'ready',
  initialBalance: Number(simulation.initial_balance),
  currentBalance: Number(simulation.current_balance),
  availableFunds: Number(simulation.available_funds),
  profitLoss: Number(simulation.profit_loss),
  startDate: simulation.start_date,
  currentDate: simulation.current_date,
  finishDate: simulation.finish_date,
  finishedAt: simulation.finished_at,
  tradingDates: simulation.trading_dates,
  stockPositions: simulation.positions.map((position) => ({
    positionId: position.position_id,
    stockId: position.stock_id,
    stock: {
      stockId: position.stock.stock_id,
      ticker: position.stock.ticker,
      companyName: position.stock.company_name ?? '',
      sector: position.stock.sector ?? '',
      industry: position.stock.industry ?? '',
      description: position.stock.description ?? '',
      sharesOutstanding: position.stock.sharesOutstanding ?? 0,
      floatShares: position.stock.floatShares ?? 0,
      country: position.stock.country ?? '',
      currency: position.stock.currency ?? '',
      website: position.stock.website ?? '',
    },
    amount: Number(position.amount),
    currentPrice: Number(position.current_price ?? 0),
    previousPrice: Number(position.previous_price ?? 0),
    priceChange: Number(position.price_change ?? 0),
    priceChangePercent: Number(position.price_change_percent ?? 0),
    volume: Number(position.volume ?? 0),
    transactions: simulation.transactions
      .filter((transaction) => transaction.stock_id === position.stock_id)
      .map((transaction) => ({
        transactionId: transaction.transaction_id,
        transactionTime: transaction.transaction_time,
        transactionType: transaction.transaction_type,
        amount: Number(transaction.amount),
        price: Number(transaction.price),
      })),
  })),
  pricesByStockId: {},
  error: null,
});
