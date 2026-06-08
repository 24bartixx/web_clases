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

export interface TradingChartProps extends HTMLAttributes<HTMLDivElement> {
  priceRange: Price[];
  period?: TradingChartPeriod;
}

// prettier-ignore
export const TradingChart = ({priceRange, period = {amount: 0, unit: TimeUnit.All}, ...rest}: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const lastAppliedPeriodKeyRef = useRef<string | null>(null);
  const hasAppliedInitialRangeRef = useRef(false);
  const prevLastDataTimeRef = useRef<number | null>(null);
   
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


  
  const setViewRange = useCallback((period: TradingChartPeriod) => {
    const chart = chartRef.current;
    if (!chart || candleSeriesData.length === 0) return;

    const { amount, unit } = period;

    const firstTime = candleSeriesData[0].time as UTCTimestamp;
    const lastTime = candleSeriesData[candleSeriesData.length - 1].time as UTCTimestamp;

    if (unit === TimeUnit.All) {
      chart.timeScale().setVisibleRange({ from: firstTime, to: lastTime });
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
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
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

    const handleResize = () => {
			if (chartContainerRef.current) {
				const { clientWidth, clientHeight } = chartContainerRef.current;
				chart.applyOptions({ 
					width: clientWidth, 
					height: clientHeight 
				});
			}
		};
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
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
