"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, AreaSeries } from "lightweight-charts";
import { useTheme } from "next-themes";

export default function LightweightChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme !== "light";
    const backgroundColor = isDark ? "#09090b" : "#ffffff";
    const textColor = isDark ? "#a1a1aa" : "#71717a";
    const lineColor = isDark ? "#06b6d4" : "#0891b2";
    const gridColor = isDark ? "#1f1f23" : "#f1f1f4";

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
      height: 250,
      timeScale: {
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: lineColor,
      topColor: isDark ? "rgba(6, 182, 212, 0.4)" : "rgba(8, 145, 178, 0.4)",
      bottomColor: isDark ? "rgba(6, 182, 212, 0.0)" : "rgba(8, 145, 178, 0.0)",
      lineWidth: 2,
    });

    // Mock NIFTY 50 data (June/July 2026 data points)
    const data = [
      { time: "2026-06-01", value: 23210.15 },
      { time: "2026-06-02", value: 23250.45 },
      { time: "2026-06-03", value: 23190.20 },
      { time: "2026-06-04", value: 23312.80 },
      { time: "2026-06-05", value: 23415.50 },
      { time: "2026-06-08", value: 23480.10 },
      { time: "2026-06-09", value: 23395.40 },
      { time: "2026-06-10", value: 23510.60 },
      { time: "2026-06-11", value: 23620.15 },
      { time: "2026-06-12", value: 23712.90 },
      { time: "2026-06-15", value: 23690.30 },
      { time: "2026-06-16", value: 23785.45 },
      { time: "2026-06-17", value: 23820.60 },
      { time: "2026-06-18", value: 23950.80 },
      { time: "2026-06-19", value: 23990.25 },
      { time: "2026-06-22", value: 24085.10 },
      { time: "2026-06-23", value: 24010.50 },
      { time: "2026-06-24", value: 24150.90 },
      { time: "2026-06-25", value: 24290.45 },
      { time: "2026-06-26", value: 24320.15 },
      { time: "2026-06-29", value: 24410.60 },
      { time: "2026-06-30", value: 24395.20 },
      { time: "2026-07-01", value: 24505.80 },
    ];

    areaSeries.setData(data);
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
  }, [theme]);

  return <div ref={chartContainerRef} className="w-full h-[250px] relative" />;
}
