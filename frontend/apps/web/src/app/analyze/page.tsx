"use client";

import React, { useState } from "react";
import { PageTransition } from "@/components/ui/Animate";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TradeSetupCard, SentimentCard, ExplanationCard } from "@/components/cards";
import { CandlestickContainer } from "@/components/charts";
import { AnalyticsLayout } from "@/components/layouts";
import LightweightChart from "@/components/LightweightChart";

interface AnalysisData {
  ticker: string;
  entry: string;
  target: string;
  stopLoss: string;
  riskReward: string;
  bullish: number;
  bearish: number;
  neutral: number;
  summary: string;
}

export default function AnalyzePage() {
  const [ticker, setTicker] = useState("AAPL");
  const [indicator, setIndicator] = useState("ema");
  const [running, setRunning] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);

  const options = [
    { label: "Exponential Moving Avg (EMA)", value: "ema" },
    { label: "Relative Strength Index (RSI)", value: "rsi" },
    { label: "Moving Average Convergence (MACD)", value: "macd" },
  ];

  const triggerRun = () => {
    setRunning(true);
    setData(null);
    setTimeout(() => {
      setRunning(false);
      setData({
        ticker: ticker.toUpperCase(),
        entry: "₹2,820.00 - ₹2,840.00",
        target: "₹2,950.00",
        stopLoss: "₹2,775.00",
        riskReward: "1:2.45",
        bullish: 74,
        bearish: 12,
        neutral: 14,
        summary: `Moving Average Convergence (MACD) signal reports a golden cross pattern. Standard volume indicators support a swing breakout in the NIFTY 50 listing.`
      });
    }, 1200);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-text-primary">Quantitative Analyzer</h2>
          <p className="text-xs text-text-secondary">Run mathematical indicators on NIFTY 50 assets</p>
        </div>

        {/* Analytics Layout */}
        <AnalyticsLayout
          chartSection={
            <CandlestickContainer title={`Technical Chart: ${ticker.toUpperCase()}`}>
              <LightweightChart />
            </CandlestickContainer>
          }
          controlsSection={
            <div className="p-6 rounded-[20px] bg-card border border-border space-y-4 glass shadow-soft">
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block border-b border-border/40 pb-2">
                Calculation Bounds
              </span>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary font-semibold uppercase">Security Ticker</label>
                  <Input
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="font-mono"
                    placeholder="e.g. RELIANCE"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary font-semibold uppercase">Indicator Strategy</label>
                  <Select
                    options={options}
                    value={indicator}
                    onChange={(e) => setIndicator(e.target.value)}
                  />
                </div>

                <Button
                  onClick={triggerRun}
                  loading={running}
                  variant="ai"
                  className="w-full mt-2"
                >
                  Calculate Indicators
                </Button>
              </div>
            </div>
          }
          detailsSection={
            data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                {/* Trade Setup Card */}
                <TradeSetupCard {...data} />

                {/* Sentiment Card */}
                <SentimentCard {...data} />

                {/* AI Rationale Explanation */}
                <div className="md:col-span-2">
                  <ExplanationCard
                    title="Calculation Rationale"
                    explanation={data.summary}
                    sourceDocs={["NIFTY_MACD_黄金.csv", "NSE_VOLUME_DELTA.log"]}
                  />
                </div>
              </div>
            )
          }
        />
      </div>
    </PageTransition>
  );
}
