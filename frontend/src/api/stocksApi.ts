import { apiUrl } from '../utils/apiUrl';
import { mapStockDtoToStock } from '../types';
import type { Stock, StockDto } from '../types';

type GetStocksParams = {
  skip?: number;
  limit?: number;
};

export async function getStocks({
  skip = 0,
  limit = 100,
}: GetStocksParams = {}): Promise<Stock[]> {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });

  const response = await fetch(apiUrl(`/api/stocks/?${params.toString()}`));

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const stocks = (await response.json()) as StockDto[];

  return stocks.map(mapStockDtoToStock);
}
