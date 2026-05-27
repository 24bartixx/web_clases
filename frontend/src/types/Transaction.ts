export type Transaction = {
    transactionId: number;
    transactionTime: string;
    transactionType: 'buy' | 'sell';
    amount: number;
    price: number;
}