import { apiUrl } from '../utils/apiUrl';
import { auth_fetch } from '../utils/auth_fetch';
import type { Transaction } from '../types/Transaction';

export type CreateTransactionRequest = {
  simulationId: number;
  stockId: number;
  transactionType: 'buy' | 'sell';
  transactionTime: string;
  price: number;
  amount: number;
};

type TransactionDto = {
  transaction_id: number;
  transaction_time: string;
  transaction_type: 'buy' | 'sell';
  price: number | string;
  amount: number | string;
  stock_id: number;
  simulation_id: number;
  created_at: string;
};

const mapTransactionDtoToTransaction = (
  transactionDto: TransactionDto,
): Transaction => ({
  transactionId: transactionDto.transaction_id,
  transactionTime: transactionDto.transaction_time,
  transactionType: transactionDto.transaction_type,
  amount: Number(transactionDto.amount),
  price: Number(transactionDto.price),
});

export async function createTransaction(
  transaction: CreateTransactionRequest,
): Promise<Transaction> {
  const response = await auth_fetch(apiUrl('/api/transactions/'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      simulation_id: transaction.simulationId,
      stock_id: transaction.stockId,
      transaction_type: transaction.transactionType,
      transaction_time: transaction.transactionTime,
      price: transaction.price,
      amount: transaction.amount,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const createdTransaction = (await response.json()) as TransactionDto;

  return mapTransactionDtoToTransaction(createdTransaction);
}
