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

export const toDateOnly = (dateInput: string | null | undefined): string | null =>
  dateInput ? dateInput.slice(0, 10) : null;

export const addDaysToDateOnly = (dateOnly: string, days: number): string => {
  const [year, month, day] = dateOnly.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const addMonthsToDateOnly = (dateOnly: string, months: number): string => {
  const [year, month, day] = dateOnly.split('-').map(Number);
  const targetMonthStart = new Date(Date.UTC(year, month - 1 + months, 1));
  const targetYear = targetMonthStart.getUTCFullYear();
  const targetMonth = targetMonthStart.getUTCMonth();
  const lastTargetMonthDay = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate();
  const date = new Date(
    Date.UTC(targetYear, targetMonth, Math.min(day, lastTargetMonthDay)),
  );
  return date.toISOString().slice(0, 10);
};
