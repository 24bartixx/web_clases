import type { GameState } from '../types/GameState';

type NumericResponseValue = number | string;

interface SimulationStockResponse {
  ticker: string;
  company_name: string | null;
  sector: string | null;
  industry: string | null;
}

interface SimulationPositionResponse {
  position_id: number;
  stock_id: number;
  amount: NumericResponseValue;
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
  start_date: string;
  current_date: string;
  finish_date: string | null;
  finished_at: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  positions: SimulationPositionResponse[];
  transactions: SimulationTransactionResponse[];
}

export const mapSimulationDetailToGameState = (
  simulation: SimulationDetailResponse,
): GameState => ({
  simulationId: simulation.simulation_id,
  status: 'ready',
  currentBalance: Number(simulation.current_balance),
  startDate: simulation.start_date,
  finishDate: simulation.finish_date,
  stockPositions: simulation.positions.map((position) => ({
    positionId: position.position_id,
    stockId: position.stock_id,
    stock: {
      stockId: position.stock_id,
      ticker: position.stock.ticker,
      companyName: position.stock.company_name ?? '',
      sector: position.stock.sector ?? '',
      industry: position.stock.industry ?? '',
    },
    amount: Number(position.amount),
    transactions: simulation.transactions
      .filter((transaction) => transaction.stock_id === position.stock_id)
      .map((transaction) => ({
        transactionId: transaction.transaction_id,
        transactionTime: transaction.transaction_time,
        transactionType: transaction.transaction_type,
        amount: Number(transaction.amount),
        price: Number(transaction.price),
      })),
    prices: [],
  })),
  error: null,
});
