"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  BarChart2, 
  ChevronDown, 
  Plus, 
  Check, 
  Activity, 
  Info,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StockCardProps {
  ticker: string;
  name: string;
  price: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number; // e.g. 84
  profitProbability: number; // e.g. 72
  expectedReturn: string; // e.g. "+6.1%"
  risk: "Low" | "Medium" | "High";
  sector?: string;
  marketCap?: string;
  rsi?: number;
  macd?: string;
  volume?: string;
  isWatched?: boolean;
  onWatchlistToggle?: (ticker: string) => void;
  onCompare?: (ticker: string) => void;
  onAnalyze?: (ticker: string) => void;
  className?: string;
}

export function StockCard({
  ticker,
  name,
  price,
  signal,
  confidence,
  profitProbability,
  expectedReturn,
  risk,
  sector = "General",
  marketCap = "Large Cap",
  rsi = 58,
  macd = "Bullish Crossover",
  volume = "High",
  isWatched = false,
  onWatchlistToggle,
  onCompare,
  onAnalyze,
  className,
}: StockCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const signalColors = {
    BUY: {
      text: "text-emerald-500",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      border: "border-emerald-500/30",
    },
    SELL: {
      text: "text-rose-500",
      bg: "bg-rose-500/10 dark:bg-rose-500/15",
      border: "border-rose-500/30",
    },
    HOLD: {
      text: "text-amber-500",
      bg: "bg-amber-500/10 dark:bg-amber-500/15",
      border: "border-amber-500/30",
    },
  };

  const riskColors = {
    Low: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10",
    Medium: "text-amber-500 bg-amber-500/5 border-amber-500/10",
    High: "text-rose-500 bg-rose-500/5 border-rose-500/10",
  };

  const isReturnPositive = !expectedReturn.startsWith("-");

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -4, 
        borderColor: "rgba(59, 130, 246, 0.4)",
        boxShadow: "var(--shadow-soft-val)"
      }}
      transition={{ duration: 0.2 }}
      onClick={() => setIsExpanded(!isExpanded)}
      className={cn(
        "p-5 rounded-[20px] bg-card border border-border flex flex-col w-full hover:border-accent/40 glass cursor-pointer select-none overflow-hidden relative transition-all duration-300",
        isExpanded && "border-accent/60 bg-secondary/10 shadow-soft",
        className
      )}
    >
      {/* Glow highlight for high confidence BUY signals */}
      {signal === "BUY" && confidence >= 80 && (
        <div className="absolute top-0 left-0 w-24 h-1 bg-gradient-to-r from-emerald-500 via-accent to-transparent" />
      )}

      {/* Main Stock Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Stock Identity */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[14px] bg-secondary/80 flex items-center justify-center font-bold text-xs text-accent">
            {ticker.substring(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-text-primary tracking-tight">{ticker}</h4>
              <span className="font-caption text-[10px] text-text-secondary/70 bg-secondary/40 px-1.5 py-0.5 rounded">
                {sector}
              </span>
            </div>
            <span className="font-caption text-xs text-text-secondary/80 truncate block max-w-[180px]">
              {name}
            </span>
          </div>
        </div>

        {/* Mid Side: Key Trading Metrics */}
        <div className="grid grid-cols-3 md:flex md:items-center gap-4 md:gap-8 flex-1 md:justify-end">
          {/* Signal */}
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[10px] text-text-secondary font-medium">Signal</span>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-lg border mt-0.5 inline-block text-center min-w-[54px]",
              signalColors[signal].text,
              signalColors[signal].bg,
              signalColors[signal].border
            )}>
              {signal}
            </span>
          </div>

          {/* Expected Return */}
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[10px] text-text-secondary font-medium font-caption">Exp. Return</span>
            <div className={cn(
              "flex items-center gap-0.5 text-xs font-semibold mt-0.5 font-mono",
              isReturnPositive ? "text-emerald-500" : "text-rose-500"
            )}>
              {isReturnPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{expectedReturn}</span>
            </div>
          </div>

          {/* Confidence Indicator */}
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[10px] text-text-secondary font-medium font-caption">Confidence</span>
            <span className="text-xs font-bold text-text-primary font-mono mt-0.5">
              {confidence}%
            </span>
          </div>
        </div>

        {/* Right Side: Price & Expand Trigger */}
        <div className="flex items-center justify-between md:justify-end gap-4 border-t border-border/20 pt-3 md:border-t-0 md:pt-0">
          <div className="text-left md:text-right">
            <div className="text-xs text-text-secondary md:hidden">Price</div>
            <span className="font-mono font-bold text-sm text-text-primary">{price}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onWatchlistToggle) onWatchlistToggle(ticker);
              }}
              className={cn(
                "p-2 rounded-xl border border-border/40 hover:border-accent/40 bg-secondary/20 hover:bg-secondary/40 text-text-secondary transition-all cursor-pointer",
                isWatched && "border-amber-500/40 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10"
              )}
              title="Add to Watchlist"
            >
              <Star className={cn("w-4 h-4", isWatched && "fill-amber-500")} />
            </button>
            
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="p-1.5 rounded-lg text-text-secondary"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Expandable Technical Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
              {/* Detailed metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/20 p-4 rounded-xl border border-border/20">
                <div>
                  <span className="text-[10px] text-text-secondary block">Profit Probability</span>
                  <span className="text-xs font-bold text-text-primary font-mono">{profitProbability}%</span>
                  <div className="w-full h-1 bg-border rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${profitProbability}%` }}
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-text-secondary block">Risk Profile</span>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block mt-1", riskColors[risk])}>
                    {risk} Risk
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-text-secondary block">Relative Strength (RSI)</span>
                  <span className="text-xs font-bold text-text-primary font-mono mt-0.5 block">{rsi}</span>
                  <span className="text-[9px] text-text-secondary">
                    {rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : "Neutral Zone"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-text-secondary block">MACD Indicator</span>
                  <span className="text-xs font-semibold text-text-primary mt-0.5 block flex items-center gap-1">
                    <Activity className="w-3 h-3 text-accent" /> {macd}
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap gap-2 justify-between items-center pt-2">
                <div className="flex gap-2">
                  <span className="text-[10px] text-text-secondary/70 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Mkt Cap: {marketCap}
                  </span>
                  <span className="text-[10px] text-text-secondary/70">|</span>
                  <span className="text-[10px] text-text-secondary/70">Volume: {volume}</span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCompare) onCompare(ticker);
                    }}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-text-primary hover:bg-secondary/40 transition-colors cursor-pointer"
                  >
                    Compare
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAnalyze) onAnalyze(ticker);
                    }}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Analyze Setup
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default StockCard;
