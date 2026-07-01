"use client";

import { useEffect, useRef, useState } from "react";
import { 
  createChart, 
  ColorType, 
  CandlestickSeries, 
  HistogramSeries, 
  LineSeries,
  IChartApi
} from "lightweight-charts";
import { useTheme } from "next-themes";

export interface LightweightChartProps {
  ticker: string;
  timeframe: "1D" | "5D" | "1M" | "3M" | "1Y";
  activeIndicators: string[]; // e.g. ["ma20", "ma50", "ema20", "ema50", "bb"]
}

// Helper to generate consistent mock candle data based on ticker name hash
function generateCandleData(ticker: string, count: number) {
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) {
    seed += ticker.charCodeAt(i);
  }

  let price = 500 + (seed % 1500); // base price between 500 and 2000
  if (ticker === "TCS") price = 3900;
  if (ticker === "RELIANCE") price = 2800;
  if (ticker === "HDFCBANK") price = 1600;
  if (ticker === "TRENT") price = 4800;
  if (ticker === "BAJAJ FINANCE") price = 6900;
  if (ticker === "TATASTEEL") price = 145;

  const data = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - count);

  for (let i = 0; i < count; i++) {
    const curDate = new Date(baseDate.getTime());
    curDate.setDate(curDate.getDate() + i);
    
    // Skip weekends for mock data
    if (curDate.getDay() === 0 || curDate.getDay() === 6) continue;

    const dateString = curDate.toISOString().split("T")[0];

    const volSeed = Math.sin(i * 0.1) + Math.cos(i * 0.2) + 2;
    const volValue = Math.floor(volSeed * 1000000 + (seed % 200000));

    // Daily walk
    const change = price * (Math.sin(i * 0.05 + seed) * 0.015 + (Math.random() - 0.5) * 0.02);
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + price * Math.random() * 0.01;
    const low = Math.min(open, close) - price * Math.random() * 0.01;

    data.push({
      time: dateString,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: volValue,
      color: close >= open ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)",
    });

    price = close;
  }
  return data;
}

// Indicator calculation helpers
function calculateSMA(data: any[], period: number) {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue;
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    sma.push({ time: data[i].time, value: sum / period });
  }
  return sma;
}

function calculateEMA(data: any[], period: number) {
  const ema = [];
  const k = 2 / (period + 1);
  let val = data[0].close;
  
  ema.push({ time: data[0].time, value: val });
  
  for (let i = 1; i < data.length; i++) {
    val = data[i].close * k + val * (1 - k);
    ema.push({ time: data[i].time, value: val });
  }
  return ema;
}

function calculateBollingerBands(data: any[], period: number = 20, multiplier: number = 2) {
  const upper = [];
  const lower = [];
  const middle = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue;
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const mean = sum / period;

    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(data[i - j].close - mean, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);

    middle.push({ time: data[i].time, value: mean });
    upper.push({ time: data[i].time, value: mean + multiplier * stdDev });
    lower.push({ time: data[i].time, value: mean - multiplier * stdDev });
  }

  return { upper, middle, lower };
}

export function LightweightChart({ ticker, timeframe, activeIndicators }: LightweightChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme !== "light";
    const backgroundColor = isDark ? "#09090b" : "#ffffff";
    const textColor = isDark ? "#a1a1aa" : "#71717a";
    const gridColor = isDark ? "#1f1f23" : "#f1f1f4";

    // Set sample counts based on timeframe
    let candleCount = 60;
    if (timeframe === "1D") candleCount = 30;
    if (timeframe === "5D") candleCount = 45;
    if (timeframe === "1M") candleCount = 60;
    if (timeframe === "3M") candleCount = 100;
    if (timeframe === "1Y") candleCount = 250;

    const candles = generateCandleData(ticker, candleCount);

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor: textColor,
        fontFamily: "var(--font-geist-sans), sans-serif",
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      width: chartContainerRef.current.clientWidth,
      height: 320,
      timeScale: {
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });

    // 1. Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
    });
    candleSeries.setData(candles.map(c => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    })));

    // 2. Volume Overlay Panel (Bottom margins)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "", // Overlay on main pane
    });
    
    // Position Volume Series at the bottom 25% of the chart
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.75,
        bottom: 0,
      },
    });

    volumeSeries.setData(candles.map(c => ({
      time: c.time,
      value: c.volume,
      color: c.color
    })));

    // 3. Render Technical Overlays
    const activeSeriesList: any[] = [];

    // MA20
    if (activeIndicators.includes("ma20")) {
      const ma20Data = calculateSMA(candles, 20);
      const ma20Series = chart.addSeries(LineSeries, {
        color: "#3b82f6",
        lineWidth: 1.5,
        title: "MA 20",
      });
      ma20Series.setData(ma20Data);
      activeSeriesList.push(ma20Series);
    }

    // MA50
    if (activeIndicators.includes("ma50")) {
      const ma50Data = calculateSMA(candles, 50);
      const ma50Series = chart.addSeries(LineSeries, {
        color: "#ec4899",
        lineWidth: 1.5,
        title: "MA 50",
      });
      ma50Series.setData(ma50Data);
      activeSeriesList.push(ma50Series);
    }

    // EMA20
    if (activeIndicators.includes("ema20")) {
      const ema20Data = calculateEMA(candles, 20);
      const ema20Series = chart.addSeries(LineSeries, {
        color: "#10b981",
        lineWidth: 1.5,
        title: "EMA 20",
      });
      ema20Series.setData(ema20Data);
      activeSeriesList.push(ema20Series);
    }

    // EMA50
    if (activeIndicators.includes("ema50")) {
      const ema50Data = calculateEMA(candles, 50);
      const ema50Series = chart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 1.5,
        title: "EMA 50",
      });
      ema50Series.setData(ema50Data);
      activeSeriesList.push(ema50Series);
    }

    // Bollinger Bands
    if (activeIndicators.includes("bb")) {
      const bbData = calculateBollingerBands(candles, 20, 2);
      
      const upperBB = chart.addSeries(LineSeries, {
        color: "rgba(168, 85, 247, 0.5)",
        lineWidth: 1,
        title: "BB Upper",
      });
      upperBB.setData(bbData.upper);

      const lowerBB = chart.addSeries(LineSeries, {
        color: "rgba(168, 85, 247, 0.5)",
        lineWidth: 1,
        title: "BB Lower",
      });
      lowerBB.setData(bbData.lower);

      const basisBB = chart.addSeries(LineSeries, {
        color: "rgba(168, 85, 247, 0.3)",
        lineWidth: 1,
        title: "BB Basis",
      });
      basisBB.setData(bbData.middle);

      activeSeriesList.push(upperBB, lowerBB, basisBB);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [theme, ticker, timeframe, activeIndicators]);

  return <div ref={chartContainerRef} className="w-full h-[320px] relative" />;
}

export default LightweightChart;
