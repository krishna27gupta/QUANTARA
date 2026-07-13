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
  { ticker: "RELIANCE", name: "Reliance Industries Ltd.", sector: "Energy", price: 2845.20, dailyChange: 1.42, volume: "12.4M", marketCap: "19.2T", momentum: "Strong", trend: "Bullish", rsi: 62, macd: "1.8 (Bullish Cross)", adx: 29, atr: 32.50, similarStocks: [{ ticker: "TCS", name: "Tata Consultancy Services", price: "₹3,920.10", change: "-0.85%", similarity: 92 }] },
  { ticker: "TCS", name: "Tata Consultancy Services Ltd.", sector: "IT", price: 3920.10, dailyChange: -0.85, volume: "4.8M", marketCap: "14.3T", momentum: "Neutral", trend: "Bullish", rsi: 54, macd: "0.4 (Neutral Crossover)", adx: 22, atr: 41.20, similarStocks: [{ ticker: "RELIANCE", name: "Reliance Industries", price: "₹2,845.20", change: "+1.42%", similarity: 92 }] },
  { ticker: "HDFCBANK", name: "HDFC Bank Ltd.", sector: "Banking", price: 1612.45, dailyChange: 2.10, volume: "24.5M", marketCap: "12.2T", momentum: "Bullish", trend: "Strong Bullish", rsi: 68, macd: "4.2 (Bullish Expansion)", adx: 35, atr: 24.80, similarStocks: [{ ticker: "ICICIBANK", name: "ICICI Bank Ltd.", price: "₹1,185.30", change: "+1.85%", similarity: 94 }] },
  { ticker: "INFY", name: "Infosys Ltd.", sector: "IT", price: 1485.60, dailyChange: -1.20, volume: "6.2M", marketCap: "6.2T", momentum: "Bearish", trend: "Neutral", rsi: 42, macd: "-1.5 (Bearish Cross)", adx: 18, atr: 28.40, similarStocks: [{ ticker: "TCS", name: "Tata Consultancy Services", price: "₹3,920.10", change: "-0.85%", similarity: 89 }] },
  { ticker: "ICICIBANK", name: "ICICI Bank Ltd.", sector: "Banking", price: 1185.30, dailyChange: 1.85, volume: "18.4M", marketCap: "8.3T", momentum: "Strong", trend: "Bullish", rsi: 65, macd: "3.1 (Bullish Trend)", adx: 32, atr: 19.50, similarStocks: [{ ticker: "HDFCBANK", name: "HDFC Bank Ltd.", price: "₹1,612.45", change: "+2.10%", similarity: 94 }] },
  { ticker: "ITC", name: "ITC Ltd.", sector: "Consumer", price: 425.80, dailyChange: -0.15, volume: "8.5M", marketCap: "5.3T", momentum: "Neutral", trend: "Sideways", rsi: 50, macd: "0.1 (Flat)", adx: 14, atr: 8.20, similarStocks: [{ ticker: "HINDUNILVR", name: "Hindustan Unilever", price: "₹2,340.50", change: "-0.45%", similarity: 85 }] }
];

interface PredictionResponse {
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  profit_probability: number;
  expected_return: number;
  risk: string;
  quantara_score: number;
  explanation: {
    id: string;
    title: string;
    shortDesc: string;
    fullExplanation: string;
    tip: string;
  }[];
  model_sources: {
    trend: string;
    profit: string;
    risk: string;
    expected_return: string;
    sentiment: string;
  };
}

function AnalyzeContent() {
  const searchParams = useSearchParams();
  
  // States
  const [ticker, setTicker] = useState("RELIANCE");
  const [timeframe, setTimeframe] = useState<"1D" | "5D" | "1M" | "3M" | "1Y">("1M");
  const [activeIndicators, setActiveIndicators] = useState<string[]>(["ma20", "bb"]);
  const [isLoading, setIsLoading] = useState(true);
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null);
  const [isError, setIsError] = useState(false);

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

  useEffect(() => {
    let isMounted = true;
    const fetchPrediction = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const res = await fetch(`http://localhost:8000/api/v1/predict?symbol=${ticker}`);
        if (!res.ok) throw new Error("Failed to fetch prediction");
        const data = await res.json();
        if (isMounted) setPredictionData(data);
      } catch (err) {
        if (isMounted) setIsError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchPrediction();
    return () => { isMounted = false; };
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
            {isError || !predictionData ? (
              <div className="flex items-center justify-center h-64 border border-rose-500/30 rounded-xl bg-rose-500/5">
                <span className="text-sm font-bold text-rose-500">
                  Live Prediction Unavailable. Please ensure the ML backend is running.
                </span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 2. STOCK HERO */}
                <StockHero
                  ticker={currentStock.ticker}
                  name={currentStock.name}
                  sector={currentStock.sector}
                  price={currentStock.price}
                  dailyChange={currentStock.dailyChange}
                  volume={currentStock.volume}
                  marketCap={currentStock.marketCap}
                  signal={predictionData.signal}
                  confidence={predictionData.confidence}
                  profitProbability={predictionData.profit_probability}
                  expectedReturn={predictionData.expected_return}
                  score={predictionData.quantara_score}
                />

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
                    expectedReturn={predictionData.expected_return}
                    confidence={predictionData.confidence}
                    currentPrice={currentStock.price}
                    profitProbability={predictionData.profit_probability}
                  />

                  {/* Risk */}
                  <RiskAnalysis
                    riskLevel={predictionData.risk}
                    riskModel={predictionData.model_sources.risk}
                  />

                  {/* Sentiment */}
                  <SentimentAnalysis
                    sentimentModel={predictionData.model_sources.sentiment}
                  />
                </div>

                {/* 5. AI EXPLANATION */}
                <AIExplanation 
                  ticker={ticker} 
                  signal={predictionData.signal} 
                  rationales={predictionData.explanation}
                  modelSources={predictionData.model_sources}
                />

                {/* 6. TECHNICAL INDICATORS */}
                <TechnicalIndicators
                  momentum={currentStock.momentum}
                  trend={currentStock.trend}
                  risk={predictionData.risk}
                  rsi={currentStock.rsi}
                  macd={currentStock.macd}
                  adx={currentStock.adx}
                  atr={currentStock.atr}
                />

                {/* 8. SIMILAR OPPORTUNITIES PATTERN GRID */}
                <SimilarOpportunities
                  currentTicker={ticker}
                  similarStocks={currentStock.similarStocks}
                  onSelect={handleSelectStock}
                />
              </div>
            )}
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
