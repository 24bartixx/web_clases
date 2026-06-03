export type Stock = {
  stockId: number;
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
};

export type StockMinimal = Pick<Stock, 'stockId' | 'ticker' | 'companyName'>;

export type StockDto = {
    stock_id: number;
    ticker: string;
    company_name: string;
    sector: string;
    industry: string;
};

export const mapStockDtoToStock = (stockDto: StockDto): Stock => ({
    stockId: stockDto.stock_id,
    ticker: stockDto.ticker,
    companyName: stockDto.company_name,
    sector: stockDto.sector,
    industry: stockDto.industry,
});


export type StockDetails = {
  description: string;
  sharesOutstanding: number;
  floatShares: number;
  country: string;
  currency: string;
  website: string;
};

export type StockDetailsDto = {
  description: string;
  sharesOutstanding: number;
  floatShares: number;
  country: string;
  currency: string;
  website: string;
};

export const mapStockDetailsDtoToStockDetails = (detailsDto: StockDetailsDto): StockDetails => ({
  description: detailsDto.description,
  sharesOutstanding: detailsDto.sharesOutstanding,
  floatShares: detailsDto.floatShares,
  country: detailsDto.country,
  currency: detailsDto.currency,
  website: detailsDto.website,
});
