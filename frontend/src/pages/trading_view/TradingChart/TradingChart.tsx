import { useEffect, useRef, HTMLAttributes, useCallback, useMemo } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  IChartApi,
  LineStyle,
  CrosshairMode,
  PriceScaleMode,
  UTCTimestamp,
  Time,
  TimeRangeChangeEventHandler,
  LogicalRangeChangeEventHandler,
} from 'lightweight-charts';
import { toTimestamp } from './../../../utils';
import { Price } from '../../../types';

export enum TimeUnit {
  Day = 'd',
  Month = 'm',
  Year = 'y',
  All = 'all',
}

export type TradingChartPeriod = {
  amount: number;
  unit: TimeUnit;
};

export type TradingChartVisibleRange = {
  from: string | null;
  to: string | null;
  barsBefore: number | null;
};

export interface TradingChartProps extends HTMLAttributes<HTMLDivElement> {
  priceRange: Price[];
  period?: TradingChartPeriod;
  isLoading?: boolean;
  onVisibleRangeChange?: (range: TradingChartVisibleRange) => void;
}

const timeToDateOnly = (time: Time): string | null => {
  if (typeof time === 'number') {
    return new Date(Number(time) * 1000).toISOString().slice(0, 10);
  }

  if (typeof time === 'string') {
    return time.slice(0, 10);
  }

  if ('year' in time) {
    return new Date(Date.UTC(time.year, time.month - 1, time.day))
      .toISOString()
      .slice(0, 10);
  }

  return null;
};

const ALL_HISTORY_MIN_BAR_SPACING = 0.01;

// prettier-ignore
export const TradingChart = ({priceRange, period = {amount: 0, unit: TimeUnit.All}, isLoading = false, onVisibleRangeChange, ...rest}: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const lastAppliedPeriodKeyRef = useRef<string | null>(null);
  const hasAppliedInitialRangeRef = useRef(false);
  const prevLastDataTimeRef = useRef<number | null>(null);
  const onVisibleRangeChangeRef = useRef(onVisibleRangeChange);
   
  const getCssVar = (variable: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  };

  const candleSeriesData = useMemo(() => priceRange.map(price => ({
    time: toTimestamp(price.priceDate),
    value: price.volume,
    open: price.open,
    high: price.high,
    low: price.low,
    close: price.close,
  })), [priceRange]);

  const volumeSeriesData = useMemo(() => priceRange.map(price => ({
  time: toTimestamp(price.priceDate),
  value: price.volume,    
  color: price.close >= price.open ? getCssVar('--bs-candle-up-color') : getCssVar('--bs-candle-down-color')
})), [priceRange]);

  useEffect(() => {
    onVisibleRangeChangeRef.current = onVisibleRangeChange;
  }, [onVisibleRangeChange]);

  useEffect(() => {
    const chart = chartRef.current;

    if (!chart) {
      return;
    }

    chart.applyOptions({
      handleScroll: !isLoading,
      handleScale: !isLoading,
    });
  }, [isLoading]);


  
  const setViewRange = useCallback((period: TradingChartPeriod) => {
    const chart = chartRef.current;
    if (!chart || candleSeriesData.length === 0) return;

    const { amount, unit } = period;

    const lastTime = candleSeriesData[candleSeriesData.length - 1].time as UTCTimestamp;

    if (unit === TimeUnit.All) {
      chart.timeScale().applyOptions({
        minBarSpacing: ALL_HISTORY_MIN_BAR_SPACING,
        rightOffset: 0,
      });
      chart.timeScale().fitContent();
      return;
    }

    const startDate = new Date(Number(lastTime) * 1000);

    switch (unit) {
      case TimeUnit.Day:
        startDate.setDate(startDate.getDate() - amount);
        break;
      case TimeUnit.Month:
        startDate.setMonth(startDate.getMonth() - amount);
        break;
      case TimeUnit.Year:
        startDate.setFullYear(startDate.getFullYear() - amount);
        break;
    }

    const from = Math.floor(startDate.getTime() / 1000) as UTCTimestamp;
    

    chart.timeScale().setVisibleRange({
      from: from,
      to: (lastTime) as UTCTimestamp,
    });
}, [candleSeriesData]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    
    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      width: chartContainerRef.current.clientWidth || 300,
      height: chartContainerRef.current.clientHeight || 300,
			layout: { 
        background: { 
          type: ColorType.Solid,
          color: getCssVar('--bs-body-bg'),
        },

        textColor: getCssVar('--bs-body-color'),
        fontSize: 14,
      },

      grid: {
        vertLines: { 
          color: getCssVar('--bs-border-color'),
          style: LineStyle.Solid,
          visible: true,
        },

        horzLines: { 
          color: getCssVar('--bs-border-color'),
          style: LineStyle.Solid,
          visible: true,
        },
      },

			crosshair: {
				mode: CrosshairMode.Normal,
				vertLine: {
					color: getCssVar('--bs-gray-400'),
					style: LineStyle.LargeDashed,
					visible: true,
					width: 1,
					labelBackgroundColor: getCssVar('--bs-body-color'), 
				},
				horzLine: {
					color: getCssVar('--bs-gray-400'),
					style: LineStyle.LargeDashed,
					visible: true,
					width: 1,
					labelBackgroundColor: getCssVar('--bs-body-color'),
				},
			},

      rightPriceScale: {
        borderColor: getCssVar('--bs-border-color'),
				textColor: getCssVar('--bs-body-color'),
				mode: PriceScaleMode.Normal,
        visible: true,
				autoScale: true,
				invertScale: false,
				entireTextOnly: false,
      },

      timeScale: {
        minBarSpacing: ALL_HISTORY_MIN_BAR_SPACING,
      },

      handleScroll: true,
      handleScale: true,


      
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: getCssVar('--bs-candle-up-color'),
      downColor: getCssVar('--bs-candle-down-color'),
			borderVisible: false,
			wickUpColor: getCssVar('--bs-candle-up-color'),
			wickDownColor: getCssVar('--bs-candle-down-color'),
    });

    candleSeries.priceScale().applyOptions({
      scaleMargins: { 
        top: 0.1, 
        bottom: 0.0 
      }, 
      visible: true,
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
			priceFormat: {
				type: 'volume',
				precision: 0,
				minMove: 1,
			},
			priceScaleId: '',

			lastValueVisible: true, 
			priceLineVisible: false,
		});

    volumeSeries.priceScale().applyOptions({
			scaleMargins: {
				top: 0.85, 
				bottom: 0,
			},
			visible: true, 
		});
    volumeSeriesRef.current = volumeSeries;

    const notifyVisibleRangeChange = (
      range: { from: Time; to: Time } | null,
      barsBefore: number | null,
    ) => {
      const visibleRangeHandler = onVisibleRangeChangeRef.current;

      if (!visibleRangeHandler) {
        return;
      }

      visibleRangeHandler({
        from: range ? timeToDateOnly(range.from) : null,
        to: range ? timeToDateOnly(range.to) : null,
        barsBefore,
      });
    };
    const getBarsBefore = () => {
      const logicalRange = chart.timeScale().getVisibleLogicalRange();
      const barsInfo = logicalRange
        ? candleSeriesRef.current?.barsInLogicalRange(logicalRange)
        : null;

      return typeof barsInfo?.barsBefore === 'number'
        ? barsInfo.barsBefore
        : null;
    };
    const handleVisibleRangeChange: TimeRangeChangeEventHandler<Time> = (range) => {
      notifyVisibleRangeChange(range, getBarsBefore());
    };
    const handleVisibleLogicalRangeChange: LogicalRangeChangeEventHandler = (range) => {
      const timeRange = chart.timeScale().getVisibleRange();
      const barsInfo = range
        ? candleSeriesRef.current?.barsInLogicalRange(range)
        : null;
      const barsBefore = typeof barsInfo?.barsBefore === 'number'
        ? barsInfo.barsBefore
        : null;

      notifyVisibleRangeChange(timeRange, barsBefore);
    };

    chart
      .timeScale()
      .subscribeVisibleTimeRangeChange(handleVisibleRangeChange);
    chart
      .timeScale()
      .subscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);

    return () => {
      chart
        .timeScale()
        .unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
      chart
        .timeScale()
        .unsubscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      lastAppliedPeriodKeyRef.current = null;
      hasAppliedInitialRangeRef.current = false;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;

    if (!chart || !candleSeriesRef.current || !volumeSeriesRef.current) {
      return;
    }

    const periodKey = `${period.unit}:${period.amount}`;
    const shouldApplyPeriodRange =
      !hasAppliedInitialRangeRef.current ||
      lastAppliedPeriodKeyRef.current !== periodKey;

    candleSeriesRef.current.setData(candleSeriesData);
    volumeSeriesRef.current.setData(volumeSeriesData);

    if (shouldApplyPeriodRange) {
      setViewRange(period);
      hasAppliedInitialRangeRef.current = true;
      lastAppliedPeriodKeyRef.current = periodKey;
      prevLastDataTimeRef.current =
        candleSeriesData.length > 0
          ? (candleSeriesData[candleSeriesData.length - 1].time as number)
          : null;
      return;
    }

    const lastDataTime =
      candleSeriesData.length > 0
        ? (candleSeriesData[candleSeriesData.length - 1].time as number)
        : null;

    let visibleRight: number | null = null;
    try {
      const vr = chart.timeScale().getVisibleRange();
      visibleRight = vr ? (vr.to as number) : null;
    } catch (e) {
      visibleRight = null;
    }

    const prevLast = prevLastDataTimeRef.current;

    if (lastDataTime !== null && prevLast !== null && lastDataTime > prevLast) {
      if (visibleRight !== null && lastDataTime > visibleRight) {
        chart.timeScale().scrollToRealTime();
        prevLastDataTimeRef.current = lastDataTime;
        return;
      }
    }

    try {
      const scrollPos = chart.timeScale().scrollPosition();
      if (Math.abs(scrollPos) < 0.5) {
        chart.timeScale().scrollToRealTime();
      }
    } catch (e) {}

    prevLastDataTimeRef.current = lastDataTime;
  }, [candleSeriesData, period, setViewRange, volumeSeriesData]);

  return <div ref={chartContainerRef} {...rest} />;
};
