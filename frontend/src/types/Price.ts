export type Price = {
  priceDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type PriceDto = {
  price_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export const mapPriceDtoToPrice = (priceDto: PriceDto): Price => ({
  priceDate: priceDto.price_date,
  open: priceDto.open,
  high: priceDto.high,
  low: priceDto.low,
  close: priceDto.close,
  volume: priceDto.volume,
});