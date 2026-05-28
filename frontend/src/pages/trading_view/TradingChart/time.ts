import { BusinessDay, UTCTimestamp } from 'lightweight-charts';

export const toTimestamp = (dateInput: UTCTimestamp | BusinessDay | string): UTCTimestamp => {
  if (typeof dateInput === 'number') {
    return dateInput as UTCTimestamp;
  }

  if (typeof dateInput === 'object' && 'year' in dateInput) {
    const { year, month, day } = dateInput;
    return Math.floor(new Date(year, month - 1, day).getTime() / 1000) as UTCTimestamp;
  }

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    console.warn('toTimestamp: Niepoprawny format daty', dateInput);
    return 0 as UTCTimestamp;
  }

  return Math.floor(date.getTime() / 1000) as UTCTimestamp;
};