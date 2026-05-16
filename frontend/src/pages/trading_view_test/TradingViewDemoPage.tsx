import "./TradingViewDemoPage.css";
import { useEffect, useRef } from "react";
import {
  createChart,
  BarSeries,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  BaselineSeries,
} from "lightweight-charts";

const ohlcData = [
  { time: "2019-04-11", open: 80.01, high: 85.5, low: 78.0, close: 82.7 },
  { time: "2019-04-12", open: 82.7, high: 96.63, low: 81.0, close: 95.5 },
  { time: "2019-04-13", open: 95.5, high: 97.0, low: 76.64, close: 78.2 },
  { time: "2019-04-14", open: 78.2, high: 81.89, low: 77.5, close: 80.4 },
  { time: "2019-04-15", open: 80.4, high: 82.0, low: 74.43, close: 75.9 },
  { time: "2019-04-16", open: 75.9, high: 80.01, low: 73.5, close: 78.5 },
  { time: "2019-04-17", open: 78.5, high: 96.63, low: 77.0, close: 94.2 },
  { time: "2019-04-18", open: 94.2, high: 98.5, low: 76.64, close: 77.8 },
  { time: "2019-04-19", open: 77.8, high: 83.0, low: 76.5, close: 81.89 },
  { time: "2019-04-20", open: 81.89, high: 84.5, low: 73.0, close: 74.43 },
];

const singleValueData = [
  { time: "2019-04-11", value: 80.01 },
  { time: "2019-04-12", value: 96.63 },
  { time: "2019-04-13", value: 76.64 },
  { time: "2019-04-14", value: 81.89 },
  { time: "2019-04-15", value: 74.43 },
  { time: "2019-04-16", value: 80.01 },
  { time: "2019-04-17", value: 96.63 },
  { time: "2019-04-18", value: 76.64 },
  { time: "2019-04-19", value: 81.89 },
  { time: "2019-04-20", value: 74.43 },
];

type ChartContainerProps = {
  title: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const ChartContainer = ({ title, containerRef }: ChartContainerProps) => (
  <div className="trading-view-demo__chart-wrapper">
    <h3>{title}</h3>
    <div ref={containerRef} className="trading-view-demo__chart-container" />
  </div>
);

export function TradingViewDemoPage() {
  const barChartRef = useRef<HTMLDivElement | null>(null);
  const candleChartRef = useRef<HTMLDivElement | null>(null);
  const lineChartRef = useRef<HTMLDivElement | null>(null);
  const areaChartRef = useRef<HTMLDivElement | null>(null);
  const histogramChartRef = useRef<HTMLDivElement | null>(null);
  const baselineChartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Bar Chart
    if (barChartRef.current) {
      const chart = createChart(barChartRef.current, {
        width: 400,
        height: 300,
      });
      const series = chart.addSeries(BarSeries);
      series.setData(ohlcData);
      chart.timeScale().fitContent();
      return () => chart.remove();
    }
  }, []);

  useEffect(() => {
    // Candlestick Chart
    if (candleChartRef.current) {
      const chart = createChart(candleChartRef.current, {
        width: 400,
        height: 300,
      });
      const series = chart.addSeries(CandlestickSeries);
      series.setData(ohlcData);
      chart.timeScale().fitContent();
      return () => chart.remove();
    }
  }, []);

  useEffect(() => {
    // Line Chart
    if (lineChartRef.current) {
      const chart = createChart(lineChartRef.current, {
        width: 400,
        height: 300,
      });
      const series = chart.addSeries(LineSeries);
      series.setData(singleValueData);
      chart.timeScale().fitContent();
      return () => chart.remove();
    }
  }, []);

  useEffect(() => {
    // Area Chart
    if (areaChartRef.current) {
      const chart = createChart(areaChartRef.current, {
        width: 400,
        height: 300,
      });
      const series = chart.addSeries(AreaSeries);
      series.setData(singleValueData);
      chart.timeScale().fitContent();
      return () => chart.remove();
    }
  }, []);

  useEffect(() => {
    // Histogram Chart
    if (histogramChartRef.current) {
      const chart = createChart(histogramChartRef.current, {
        width: 400,
        height: 300,
      });
      const series = chart.addSeries(HistogramSeries);
      series.setData(singleValueData);
      chart.timeScale().fitContent();
      return () => chart.remove();
    }
  }, []);

  useEffect(() => {
    // Baseline Chart
    if (baselineChartRef.current) {
      const chart = createChart(baselineChartRef.current, {
        width: 400,
        height: 300,
      });
      const series = chart.addSeries(BaselineSeries);
      series.setData(singleValueData);
      chart.timeScale().fitContent();
      return () => chart.remove();
    }
  }, []);

  return (
    <div className="trading-view-demo">
      <header className="trading-view-demo__header">
        <h1>📊 TradingView - Wszystkie Typy Wykresów</h1>
        <p>lightweight-charts - 6 głównych typów serii danych</p>
      </header>

      <div className="trading-view-demo__charts-grid">
        <ChartContainer title="1️⃣ Bar Series" containerRef={barChartRef} />
        <ChartContainer
          title="2️⃣ Candlestick Series"
          containerRef={candleChartRef}
        />
        <ChartContainer title="3️⃣ Line Series" containerRef={lineChartRef} />
        <ChartContainer title="4️⃣ Area Series" containerRef={areaChartRef} />
        <ChartContainer
          title="5️⃣ Histogram Series"
          containerRef={histogramChartRef}
        />
        <ChartContainer
          title="6️⃣ Baseline Series"
          containerRef={baselineChartRef}
        />
      </div>
    </div>
  );
}

export default TradingViewDemoPage;
