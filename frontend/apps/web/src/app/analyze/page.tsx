"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageTransition } from "@/components/ui/Animate";
import { StockSearch } from "@/components/analyze/StockSearch";
import { StockHero } from "@/components/analyze/StockHero";
import { PredictionCard } from "@/components/analyze/PredictionCard";
import { TradeSetup } from "@/components/analyze/TradeSetup";
import { RiskAnalysis } from "@/components/analyze/RiskAnalysis";
import { SentimentAnalysis } from "@/components/analyze/SentimentAnalysis";
import { AIExplanation } from "@/components/analyze/AIExplanation";
import { TechnicalIndicators } from "@/components/analyze/TechnicalIndicators";
import { StockComparison } from "@/components/analyze/StockComparison";
import { SimilarOpportunities } from "@/components/analyze/SimilarOpportunities";
import { AskQuantaraPanel } from "@/components/analyze/AskQuantaraPanel";
import { LightweightChart } from "@/components/LightweightChart";
import { cn } from "@/lib/utils";
import { LineChart, BarChart3, HelpCircle, Activity, Sparkles, Sliders, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Comprehensive Mock database of NIFTY 50 securities
const NIFTY_STOCKS = [
  {
    ticker: "RELIANCE",
    name: "Reliance Industries Ltd.",
    sector: "Energy",
    price: 2845.20,
    dailyChange: 1.42,
    volume: "12.4M",
    marketCap: "19.2T",
    signal: "BUY" as const,
    confidence: 84,
    profitProbability: 72,
    expectedReturn: 6.1,
    score: 87,
    tomorrowPrice: 2890,
    threeDayPrice: 2930,
    sevenDayPrice: 2990,
    rangeMin: 2800,
    rangeMax: 3020,
    entryMin: 2820,
    entryMax: 2840,
    targetPrice: 2990,
    stopLossPrice: 2775,
    riskReward: "1:3",
    capitalAllocation: 15,
    holdingPeriod: "5–7 days",
    riskLevel: "Medium" as const,
    riskCategory: "High Volume Breakout",
    volatility: "Moderate" as const,
    expectedDrawdown: 3.4,
    successRate: 72,
    news: "Positive" as const,
    social: "Bullish" as const,
    sectorSentiment: "Bullish" as const,
    overallSentiment: 78,
    momentum: "Strong" as const,
    trend: "Bullish" as const,
    rsi: 62,
    macd: "1.8 (Bullish Cross)",
    adx: 29,
    atr: 32.50,
    rationales: [
      { id: "rel1", title: "Positive Market Sentiment", shortDesc: "Institutional volume supports accumulation.", fullExplanation: "Institutional inflows (FIIs) have been actively expanding their position in large-cap energy assets, driving higher base support levels.", tip: "Institutional volume is key to sustaining long swing positions." },
      { id: "rel2", title: "MACD Bullish Crossover", shortDesc: "MACD line crossed above the signal line.", fullExplanation: "The MACD line crossed above the 9-day signal line on the daily timeframe, flagging immediate upward acceleration.", tip: "Crossovers below the zero line indicate highly reliable momentum." },
      { id: "rel3", title: "Volume Spike 35%", shortDesc: "Average 20-day volume exceeded significantly.", fullExplanation: "Trading volumes are 35% higher than the 20-day moving average, confirming strong buyer interest at current support levels.", tip: "Always trade swing breakouts backed by rising volumes." }
    ],
    similarStocks: [
      { ticker: "TCS", name: "Tata Consultancy Services", price: "₹3,920.10", change: "-0.85%", similarity: 92, signal: "BUY" as const },
      { ticker: "HDFCBANK", name: "HDFC Bank Ltd.", price: "₹1,612.45", change: "+2.10%", similarity: 89, signal: "BUY" as const },
      { ticker: "TRENT", name: "Trent Ltd.", price: "₹4,850.00", change: "+3.65%", similarity: 85, signal: "BUY" as const }
    ]
  },
  {
    ticker: "TCS",
    name: "Tata Consultancy Services Ltd.",
    sector: "IT",
    price: 3920.10,
    dailyChange: -0.85,
    volume: "4.8M",
    marketCap: "14.3T",
    signal: "BUY" as const,
    confidence: 78,
    profitProbability: 68,
    expectedReturn: 4.8,
    score: 80,
    tomorrowPrice: 3950,
    threeDayPrice: 3990,
    sevenDayPrice: 4050,
    rangeMin: 3880,
    rangeMax: 4100,
    entryMin: 3890,
    entryMax: 3915,
    targetPrice: 4050,
    stopLossPrice: 3840,
    riskReward: "1:2.45",
    capitalAllocation: 10,
    holdingPeriod: "7–10 days",
    riskLevel: "Low" as const,
    riskCategory: "Oversold Consolidation",
    volatility: "Low" as const,
    expectedDrawdown: 2.1,
    successRate: 68,
    news: "Neutral" as const,
    social: "Neutral" as const,
    sectorSentiment: "Bullish" as const,
    overallSentiment: 65,
    momentum: "Neutral" as const,
    trend: "Bullish" as const,
    rsi: 54,
    macd: "0.4 (Neutral Crossover)",
    adx: 22,
    atr: 41.20,
    rationales: [
      { id: "tcs1", title: "Oversold Support Rebound", shortDesc: "RSI rebounds from oversold boundary.", fullExplanation: "The 14-day RSI touched 32 and is currently rebounding, confirming buying pressure at major structural support.", tip: "Oversold rebounds are high-probability setups in large caps." },
      { id: "tcs2", title: "200-EMA Retest Hold", shortDesc: "Support held firmly at the 200 EMA.", fullExplanation: "Daily candles bounced cleanly off the 200-period Exponential Moving Average, indicating strong structural buyers.", tip: "EMA retests check if longer-term trends remain intact." }
    ],
    similarStocks: [
      { ticker: "RELIANCE", name: "Reliance Industries", price: "₹2,845.20", change: "+1.42%", similarity: 92, signal: "BUY" as const },
      { ticker: "ASIANPAINTS", name: "Asian Paints Ltd.", price: "₹2,890.30", change: "+0.25%", similarity: 91, signal: "BUY" as const },
      { ticker: "ITC", name: "ITC Ltd.", price: "₹425.80", change: "-0.15%", similarity: 88, signal: "BUY" as const }
    ]
  },
  {
    ticker: "HDFCBANK",
    name: "HDFC Bank Ltd.",
    sector: "Banking",
    price: 1612.45,
    dailyChange: 2.10,
    volume: "24.5M",
    marketCap: "12.2T",
    signal: "BUY" as const,
    confidence: 82,
    profitProbability: 74,
    expectedReturn: 5.5,
    score: 85,
    tomorrowPrice: 1640,
    threeDayPrice: 1670,
    sevenDayPrice: 1710,
    rangeMin: 1590,
    rangeMax: 1730,
    entryMin: 1600,
    entryMax: 1612,
    targetPrice: 1710,
    stopLossPrice: 1570,
    riskReward: "1:2.8",
    capitalAllocation: 20,
    holdingPeriod: "5–7 days",
    riskLevel: "Low" as const,
    riskCategory: "Support Bounce Setup",
    volatility: "Low" as const,
    expectedDrawdown: 1.8,
    successRate: 74,
    news: "Positive" as const,
    social: "Bullish" as const,
    sectorSentiment: "Bullish" as const,
    overallSentiment: 82,
    momentum: "Strong" as const,
    trend: "Bullish" as const,
    rsi: 58,
    macd: "1.2 (Bullish Crossover)",
    adx: 26,
    atr: 18.40,
    rationales: [
      { id: "hdfc1", title: "Double Bottom Structure", shortDesc: "A clear structural floor established.", fullExplanation: "Weekly candles formed a clear double bottom rebound pattern at the ₹1,550-1,570 structural floor.", tip: "Double bottoms verify that support zones are heavily defended." }
    ],
    similarStocks: [
      { ticker: "RELIANCE", name: "Reliance Industries", price: "₹2,845.20", change: "+1.42%", similarity: 89, signal: "BUY" as const },
      { ticker: "BAJAJ FINANCE", name: "Bajaj Finance Ltd.", price: "₹6,950.00", change: "+0.45%", similarity: 87, signal: "BUY" as const },
      { ticker: "TCS", name: "Tata Consultancy Services", price: "₹3,920.10", change: "-0.85%", similarity: 84, signal: "BUY" as const }
    ]
  },
  {
    ticker: "TRENT",
    name: "Trent Ltd. (Tata Group)",
    sector: "Retail",
    price: 4850.00,
    dailyChange: 3.65,
    volume: "2.1M",
    marketCap: "1.7T",
    signal: "BUY" as const,
    confidence: 89,
    profitProbability: 75,
    expectedReturn: 12.4,
    score: 91,
    tomorrowPrice: 4980,
    threeDayPrice: 5120,
    sevenDayPrice: 5350,
    rangeMin: 4750,
    rangeMax: 5400,
    entryMin: 4800,
    entryMax: 4850,
    targetPrice: 5350,
    stopLossPrice: 4680,
    riskReward: "1:3.2",
    capitalAllocation: 15,
    holdingPeriod: "4–7 days",
    riskLevel: "High" as const,
    riskCategory: "High Momentum Breakout",
    volatility: "High" as const,
    expectedDrawdown: 5.2,
    successRate: 75,
    news: "Positive" as const,
    social: "Bullish" as const,
    sectorSentiment: "Bullish" as const,
    overallSentiment: 88,
    momentum: "Strong" as const,
    trend: "Bullish" as const,
    rsi: 72,
    macd: "3.1 (Strong Bullish)",
    adx: 34,
    atr: 95.80,
    rationales: [
      { id: "tr1", title: "Consolidation Squeeze Breakout", shortDesc: "Volume breakout from cup & handle setup.", fullExplanation: "Candles broke through the 3-month horizontal resistance channel on 3x average volume, triggering immediate entry signals.", tip: "Momentum squeezes resolve in rapid expansions." }
    ],
    similarStocks: [
      { ticker: "BAJAJ FINANCE", name: "Bajaj Finance Ltd.", price: "₹6,950.00", change: "+0.45%", similarity: 93, signal: "BUY" as const },
      { ticker: "RELIANCE", name: "Reliance Industries", price: "₹2,845.20", change: "+1.42%", similarity: 85, signal: "BUY" as const },
      { ticker: "ADANI PORTS", name: "Adani Ports", price: "₹1,240.15", change: "-1.20%", similarity: 83, signal: "BUY" as const }
    ]
  },
  {
    ticker: "BAJAJ FINANCE",
    name: "Bajaj Finance Ltd.",
    sector: "Banking",
    price: 6950.00,
    dailyChange: 0.45,
    volume: "1.8M",
    marketCap: "4.2T",
    signal: "BUY" as const,
    confidence: 80,
    profitProbability: 69,
    expectedReturn: 8.5,
    score: 82,
    tomorrowPrice: 7080,
    threeDayPrice: 7250,
    sevenDayPrice: 7480,
    rangeMin: 6850,
    rangeMax: 7600,
    entryMin: 6900,
    entryMax: 6960,
    targetPrice: 7480,
    stopLossPrice: 6780,
    riskReward: "1:2.9",
    capitalAllocation: 15,
    holdingPeriod: "5–8 days",
    riskLevel: "High" as const,
    riskCategory: "Resistance Channel Breakout",
    volatility: "High" as const,
    expectedDrawdown: 4.2,
    successRate: 69,
    news: "Positive" as const,
    social: "Bullish" as const,
    sectorSentiment: "Bullish" as const,
    overallSentiment: 79,
    momentum: "Strong" as const,
    trend: "Bullish" as const,
    rsi: 59,
    macd: "1.5 (Bullish Crossover)",
    adx: 28,
    atr: 112.40,
    rationales: [
      { id: "bf1", title: "Golden Cross Triggered", shortDesc: "50 EMA crossed above 200 EMA.", fullExplanation: "The 50-day Exponential Moving Average crossed above the 200-day EMA, confirming an institutional macro uptrend.", tip: "Golden crosses signal structural shifts from bear to bull markets." }
    ],
    similarStocks: [
      { ticker: "TRENT", name: "Trent Ltd.", price: "₹4,850.00", change: "+3.65%", similarity: 93, signal: "BUY" as const },
      { ticker: "RELIANCE", name: "Reliance Industries", price: "₹2,845.20", change: "+1.42%", similarity: 87, signal: "BUY" as const },
      { ticker: "HDFCBANK", name: "HDFC Bank Ltd.", price: "₹1,612.45", change: "+2.10%", similarity: 82, signal: "BUY" as const }
    ]
  },
  {
    ticker: "TATASTEEL",
    name: "Tata Steel Ltd.",
    sector: "Metals",
    price: 145.20,
    dailyChange: -3.40,
    volume: "42.0M",
    marketCap: "1.8T",
    signal: "SELL" as const,
    confidence: 60,
    profitProbability: 45,
    expectedReturn: -3.4,
    score: 58,
    tomorrowPrice: 141,
    threeDayPrice: 137,
    sevenDayPrice: 130,
    rangeMin: 125,
    rangeMax: 148,
    entryMin: 143,
    entryMax: 146,
    targetPrice: 130,
    stopLossPrice: 151,
    riskReward: "1:2.5",
    capitalAllocation: 5,
    holdingPeriod: "5–7 days",
    riskLevel: "High" as const,
    riskCategory: "Support Breakdown",
    volatility: "High" as const,
    expectedDrawdown: 6.4,
    successRate: 45,
    news: "Negative" as const,
    social: "Bearish" as const,
    sectorSentiment: "Bearish" as const,
    overallSentiment: 42,
    momentum: "Weak" as const,
    trend: "Bearish" as const,
    rsi: 29,
    macd: "-1.8 (Bearish Crossover)",
    adx: 32,
    atr: 4.80,
    rationales: [
      { id: "ts1", title: "Support Level Collapse", shortDesc: "Broke below historical floor support.", fullExplanation: "Metal indices reports severe selling momentum. Daily candles collapsed below major horizontal support at ₹148.", tip: "Trading breakdowns requires hedging with tight stop losses." }
    ],
    similarStocks: [
      { ticker: "TCS", name: "Tata Consultancy Services", price: "₹3,920.10", change: "-0.85%", similarity: 82, signal: "BUY" as const },
      { ticker: "ASIANPAINTS", name: "Asian Paints Ltd.", price: "₹2,890.30", change: "+0.25%", similarity: 80, signal: "BUY" as const },
      { ticker: "HDFCBANK", name: "HDFC Bank Ltd.", price: "₹1,612.45", change: "+2.10%", similarity: 77, signal: "BUY" as const }
    ]
  }
];

function AnalyzeContent() {
  const searchParams = useSearchParams();
  
  // States
  const [ticker, setTicker] = useState("RELIANCE");
  const [timeframe, setTimeframe] = useState<"1D" | "5D" | "1M" | "3M" | "1Y">("1M");
  const [activeIndicators, setActiveIndicators] = useState<string[]>(["ma20", "bb"]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync initial ticker from URL parameter
  useEffect(() => {
    const symbolParam = searchParams.get("symbol");
    if (symbolParam) {
      const match = NIFTY_STOCKS.find((s) => s.ticker.toLowerCase() === symbolParam.toLowerCase());
      if (match) {
        setTicker(match.ticker);
      }
    }
  }, [searchParams]);

  // Loading transition on ticker changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [ticker]);

  // Retrieve current active stock data
  const currentStock = useMemo(() => {
    return NIFTY_STOCKS.find((s) => s.ticker === ticker) || NIFTY_STOCKS[0];
  }, [ticker]);

  const handleSelectStock = (selected: string) => {
    setTicker(selected);
  };

  const handleIndicatorToggle = (ind: string) => {
    if (activeIndicators.includes(ind)) {
      setActiveIndicators(activeIndicators.filter((i) => i !== ind));
    } else {
      setActiveIndicators([...activeIndicators, ind]);
    }
  };

  const handleCompareTrigger = (tickerA: string, tickerB: string) => {
    const selector = document.getElementById("stock-comparison-box");
    if (selector) {
      selector.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Convert NIFTY_STOCKS to generic format for StockComparison
  const compareDatabase = useMemo(() => {
    return NIFTY_STOCKS.map((s) => ({
      ticker: s.ticker,
      name: s.name,
      price: "₹" + s.price.toLocaleString("en-IN"),
      signal: s.signal,
      confidence: s.confidence,
      profitProbability: s.profitProbability,
      expectedReturn: (s.expectedReturn >= 0 ? "+" : "") + s.expectedReturn + "%",
      risk: s.riskLevel,
      recommendation: s.rationales[0]?.title || "Stable Consolidation"
    }));
  }, []);

  // Skeleton placeholders
  const HeroSkeleton = () => (
    <div className="w-full h-[120px] rounded-[24px] bg-card/40 border border-border/60 animate-pulse flex items-center justify-between p-6 md:p-8">
      <div className="space-y-3">
        <div className="w-32 h-4 bg-secondary/80 rounded" />
        <div className="w-48 h-8 bg-secondary/80 rounded" />
      </div>
      <div className="w-32 h-10 bg-secondary/60 rounded-xl" />
    </div>
  );

  const CardSkeleton = () => (
    <div className="w-full h-[180px] rounded-[20px] bg-card/40 border border-border/60 animate-pulse p-6 space-y-4">
      <div className="w-24 h-4 bg-secondary/80 rounded" />
      <div className="w-full h-8 bg-secondary/60 rounded" />
      <div className="grid grid-cols-3 gap-2">
        <div className="h-10 bg-secondary/60 rounded" />
        <div className="h-10 bg-secondary/60 rounded" />
        <div className="h-10 bg-secondary/60 rounded" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 1. STOCK SEARCH BAR */}
      <StockSearch 
        onSelectStock={handleSelectStock} 
        currentTicker={ticker} 
        niftyStocks={NIFTY_STOCKS} 
      />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="space-y-6">
            <HeroSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-[380px] bg-card/40 border border-border/60 rounded-[20px] animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              </div>
              <div className="space-y-6">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            key={ticker}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* 2. STOCK HERO */}
            <StockHero {...currentStock} />

            {/* 3. CHART & AI PANEL SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Chart (takes 2 cols) */}
              <div className="lg:col-span-2 p-6 rounded-[20px] bg-card border border-border space-y-4 glass shadow-soft hover:border-accent/20 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                  <div>
                    <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                      <LineChart className="w-4 h-4 text-accent" /> Technical Candlestick Chart
                    </h4>
                    <span className="text-xs text-text-secondary">TradingView Lightweight charting engine</span>
                  </div>

                  {/* Timeframe selector */}
                  <div className="flex bg-secondary/40 p-1 rounded-xl border border-border/40">
                    {(["1D", "5D", "1M", "3M", "1Y"] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer",
                          timeframe === tf
                            ? "bg-accent text-white shadow-sm"
                            : "text-text-secondary hover:text-text-primary"
                        )}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lightweight Chart canvas wrapper */}
                <div className="relative w-full rounded-xl overflow-hidden bg-secondary/5 border border-border/40 p-1">
                  <LightweightChart 
                    ticker={ticker} 
                    timeframe={timeframe} 
                    activeIndicators={activeIndicators} 
                  />
                </div>

                {/* Overlays selector switches */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-[10px] text-text-secondary font-bold flex items-center uppercase tracking-wider mr-2">
                    Overlays:
                  </span>
                  {[
                    { key: "ma20", label: "MA 20 (Blue)" },
                    { key: "ma50", label: "MA 50 (Pink)" },
                    { key: "ema20", label: "EMA 20 (Green)" },
                    { key: "ema50", label: "EMA 50 (Yellow)" },
                    { key: "bb", label: "Bollinger Bands" }
                  ].map((ind) => {
                    const active = activeIndicators.includes(ind.key);
                    return (
                      <button
                        key={ind.key}
                        onClick={() => handleIndicatorToggle(ind.key)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg border text-[9px] font-bold transition-all cursor-pointer",
                          active
                            ? "bg-accent/15 border-accent/40 text-accent"
                            : "bg-secondary/40 border-border/40 text-text-secondary hover:text-text-primary"
                        )}
                      >
                        {ind.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Q&A Assistant */}
              <AskQuantaraPanel 
                currentTicker={ticker} 
                sectorName={currentStock.sector} 
                onCompareRequest={handleCompareTrigger}
              />
            </div>

            {/* 4. DUAL PANELS ROWS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prediction */}
              <PredictionCard
                tomorrowPrice={currentStock.tomorrowPrice}
                threeDayPrice={currentStock.threeDayPrice}
                sevenDayPrice={currentStock.sevenDayPrice}
                rangeMin={currentStock.rangeMin}
                rangeMax={currentStock.rangeMax}
                currentPrice={currentStock.price}
              />

              {/* Trade Setup */}
              <TradeSetup
                entryMin={currentStock.entryMin}
                entryMax={currentStock.entryMax}
                targetPrice={currentStock.targetPrice}
                stopLossPrice={currentStock.stopLossPrice}
                riskReward={currentStock.riskReward}
                capitalAllocation={currentStock.capitalAllocation}
                holdingPeriod={currentStock.holdingPeriod}
              />

              {/* Risk */}
              <RiskAnalysis
                riskLevel={currentStock.riskLevel}
                riskCategory={currentStock.riskCategory}
                volatility={currentStock.volatility}
                expectedDrawdown={currentStock.expectedDrawdown}
                successRate={currentStock.successRate}
              />

              {/* Sentiment */}
              <SentimentAnalysis
                news={currentStock.news}
                social={currentStock.social}
                sector={currentStock.sectorSentiment}
                overall={currentStock.overallSentiment}
              />

              {/* Prediction History (Step 2) */}
              <div className="p-6 rounded-[20px] bg-card border border-border space-y-4 hover:border-accent/40 glass shadow-soft relative transition-all duration-300">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-accent" /> Prediction History: {ticker}
                  </h4>
                  <span className="text-[9px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    Accuracy: 71.7%
                  </span>
                </div>
                
                <div className="space-y-2.5 text-xs">
                  {[
                    { date: "24 Jun", signal: "BUY", predicted: "+5.2%", actual: "+4.7%", status: "✓" },
                    { date: "18 Jun", signal: "BUY", predicted: "+3.9%", actual: "+5.1%", status: "✓" },
                    { date: "12 Jun", signal: "SELL", predicted: "-2.8%", actual: "-1.9%", status: "✓" }
                  ].map((pred, i) => (
                    <div key={i} className="flex justify-between items-center bg-secondary/10 border border-border/30 rounded-xl p-3 font-mono">
                      <div>
                        <span className="text-[10px] text-text-secondary block font-sans">{pred.date}</span>
                        <span className={cn("font-bold px-1.5 py-0.5 rounded text-[9px] mt-0.5 inline-block border",
                          pred.signal === "BUY" ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/10" : "text-rose-500 bg-rose-500/5 border-rose-500/10"
                        )}>{pred.signal}</span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="text-[9px] text-text-secondary font-sans block">Pred / Act</span>
                          <span className="text-text-primary font-bold">{pred.predicted} / {pred.actual}</span>
                        </div>
                        <span className="text-emerald-400 font-bold text-sm">{pred.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Performance & Validation Card (Step 3 & Step 7) */}
              <div className="p-6 rounded-[20px] bg-card border border-border space-y-4 hover:border-accent/40 glass shadow-soft relative transition-all duration-300">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-accent" /> Quantara Model Performance
                  </h4>
                  <span className="text-[9px] px-2 py-0.5 rounded-lg bg-accent/20 text-accent font-semibold border border-accent/30 animate-pulse">
                    LIVE VALIDATION
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-secondary/10 border border-border/30 rounded-xl">
                    <span className="text-[9px] text-text-secondary block font-semibold uppercase">Direction Accuracy</span>
                    <span className="text-sm font-bold font-mono text-text-primary">71.7%</span>
                  </div>
                  <div className="p-2.5 bg-secondary/10 border border-border/30 rounded-xl">
                    <span className="text-[9px] text-text-secondary block font-semibold uppercase">Trade Win Rate</span>
                    <span className="text-sm font-bold font-mono text-text-primary">62.5%</span>
                  </div>
                  <div className="p-2.5 bg-secondary/10 border border-border/30 rounded-xl">
                    <span className="text-[9px] text-text-secondary block font-semibold uppercase">Backtest Sharpe</span>
                    <span className="text-sm font-bold font-mono text-text-primary">4.33</span>
                  </div>
                  <div className="p-2.5 bg-secondary/10 border border-border/30 rounded-xl">
                    <span className="text-[9px] text-text-secondary block font-semibold uppercase">Max Drawdown</span>
                    <span className="text-sm font-bold font-mono text-rose-500">-10%</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/20 text-[9px] text-text-secondary font-mono flex justify-between">
                  <span>Tested: **2,450 Trades**</span>
                  <span>Period: **2016-2025**</span>
                </div>

                {/* Paper Trading Forward-Validation Status (Step 7) */}
                <div className="mt-3 p-3 bg-accent/5 border border-accent/15 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-text-primary font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                      Forward Paper Trading
                    </span>
                    <span className="text-[8px] text-accent font-bold uppercase tracking-wider">Validation Running</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[9px] text-text-secondary font-mono">
                    <div><span>Days Validated</span><span className="text-text-primary block font-bold">17/60</span></div>
                    <div><span>Trades executed</span><span className="text-text-primary block font-bold">31</span></div>
                    <div><span>Win rate (30d)</span><span className="text-success block font-bold">62.5%</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. AI EXPLANATION */}
            <AIExplanation 
              ticker={ticker} 
              signal={currentStock.signal} 
              rationales={currentStock.rationales} 
            />

            {/* 6. TECHNICAL INDICATORS */}
            <TechnicalIndicators
              momentum={currentStock.momentum}
              trend={currentStock.trend}
              risk={currentStock.riskLevel}
              rsi={currentStock.rsi}
              macd={currentStock.macd}
              adx={currentStock.adx}
              atr={currentStock.atr}
            />

            {/* 7. COMPARISON MATRIX BOX */}
            <div id="stock-comparison-box">
              <StockComparison 
                niftyStocks={compareDatabase} 
                defaultTickerA={ticker === "RELIANCE" ? "RELIANCE" : ticker} 
                defaultTickerB={ticker === "TCS" ? "TCS" : "RELIANCE"} 
              />
            </div>

            {/* 8. SIMILAR OPPORTUNITIES PATTERN GRID */}
            <SimilarOpportunities
              currentTicker={ticker}
              similarStocks={currentStock.similarStocks}
              onSelect={handleSelectStock}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AnalyzePage() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-xs text-text-secondary animate-pulse">Loading Analyzer Context...</div>}>
      <AnalyzeContent />
    </Suspense>
  );
}

export default function Page() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-text-primary text-2xl md:text-3xl font-extrabold tracking-tight">
            Flagship Analyzer
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Deep quantitative model forecasts, risk ratios, and live chart indexes.
          </p>
        </div>
        <AnalyzePage />
      </div>
    </PageTransition>
  );
}
