export interface PriceMetrics {
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

export const calculatePriceMetrics = (
  today: number | undefined,
  yesterday: number | undefined,
): PriceMetrics => {
  if (today === undefined || yesterday === undefined || yesterday === 0) {
    return {
      currentPrice: today ?? 0,
      priceChange: 0,
      priceChangePercent: 0,
    };
  }

  const change = today - yesterday;
  const percentage = (change / yesterday) * 100;

  return {
    currentPrice: today,
    priceChange: change,
    priceChangePercent: percentage,
  };
};
