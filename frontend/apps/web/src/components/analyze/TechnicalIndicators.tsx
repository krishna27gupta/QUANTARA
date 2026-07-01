"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sliders, HelpCircle, BarChart3, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TechnicalIndicatorsProps {
  // Simple summary
  momentum: "Strong" | "Neutral" | "Weak";
  trend: "Bullish" | "Neutral" | "Bearish";
  risk: "Low" | "Medium" | "High";
  
  // Raw parameters
  rsi: number;
  macd: string; // e.g. "1.8 (Bullish Crossover)" or raw number
  adx: number;
  atr: number;
}

export function TechnicalIndicators({
  momentum,
  trend,
  risk,
  rsi,
  macd,
  adx,
  atr,
}: TechnicalIndicatorsProps) {
  const getBadgeStyle = (val: string) => {
    if (val === "Strong" || val === "Bullish" || val === "Low") {
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    }
    if (val === "Weak" || val === "Bearish" || val === "High") {
      return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    }
    return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  };

  return (
    <motion.div
      whileHover={{ y: -4, borderColor: "rgba(59, 130, 246, 0.4)", boxShadow: "var(--shadow-soft-val)" }}
      transition={{ duration: 0.2 }}
      className="p-6 rounded-[20px] bg-card border border-border space-y-5 hover:border-accent/40 glass shadow-soft relative"
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-accent" /> Technical Indicators
        </h4>
        <span className="text-[9px] px-2 py-0.5 rounded-lg bg-accent/10 text-accent font-semibold border border-accent/20">
          Math Analytics
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Simple Summaries */}
        <div className="space-y-3.5">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Simple Interpretations</span>
          
          <div className="space-y-2">
            {/* Momentum */}
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-secondary/20 border border-border/40 text-xs">
              <span className="text-text-secondary font-medium">Momentum</span>
              <span className={cn("font-bold px-2 py-0.5 rounded text-[10px] border", getBadgeStyle(momentum))}>
                {momentum}
              </span>
            </div>

            {/* Trend */}
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-secondary/20 border border-border/40 text-xs">
              <span className="text-text-secondary font-medium">Market Trend</span>
              <span className={cn("font-bold px-2 py-0.5 rounded text-[10px] border", getBadgeStyle(trend))}>
                {trend}
              </span>
            </div>

            {/* Risk */}
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-secondary/20 border border-border/40 text-xs">
              <span className="text-text-secondary font-medium">Volatility Risk</span>
              <span className={cn("font-bold px-2 py-0.5 rounded text-[10px] border", getBadgeStyle(risk))}>
                {risk}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Raw Metrics */}
        <div className="space-y-3.5">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Raw Indicators</span>
          
          <div className="grid grid-cols-2 gap-3.5">
            {/* RSI */}
            <div className="p-3 bg-secondary/20 border border-border/40 rounded-xl space-y-1 relative group">
              <span className="text-[10px] text-text-secondary font-medium flex items-center gap-0.5">
                RSI (14) <HelpCircle className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 transition-opacity" title="Relative Strength Index measures speed and change of price movements." />
              </span>
              <span className="font-mono font-bold text-sm text-text-primary block">{rsi}</span>
              <div className="w-full h-1 bg-border rounded-full overflow-hidden mt-2">
                <div 
                  className={cn("h-full rounded-full", rsi >= 70 ? "bg-amber-500" : rsi <= 30 ? "bg-rose-500" : "bg-emerald-500")}
                  style={{ width: `${rsi}%` }}
                />
              </div>
            </div>

            {/* MACD */}
            <div className="p-3 bg-secondary/20 border border-border/40 rounded-xl space-y-1 relative group">
              <span className="text-[10px] text-text-secondary font-medium flex items-center gap-0.5">
                MACD <HelpCircle className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 transition-opacity" title="Moving Average Convergence Divergence highlights trend direction and momentum crossovers." />
              </span>
              <span className="font-mono font-bold text-xs text-text-primary block truncate">{macd}</span>
              <span className="text-[8px] text-text-secondary block">12, 26, 9 parameter</span>
            </div>

            {/* ADX */}
            <div className="p-3 bg-secondary/20 border border-border/40 rounded-xl space-y-1 relative group">
              <span className="text-[10px] text-text-secondary font-medium flex items-center gap-0.5">
                ADX (14) <HelpCircle className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 transition-opacity" title="Average Directional Index measures overall trend strength regardless of direction." />
              </span>
              <span className="font-mono font-bold text-sm text-text-primary block">{adx}</span>
              <span className={cn("text-[8px] font-bold", adx >= 25 ? "text-emerald-500" : "text-text-secondary/70")}>
                {adx >= 25 ? "Strong Trend" : "Weak Trend"}
              </span>
            </div>

            {/* ATR */}
            <div className="p-3 bg-secondary/20 border border-border/40 rounded-xl space-y-1 relative group">
              <span className="text-[10px] text-text-secondary font-medium flex items-center gap-0.5">
                ATR (14) <HelpCircle className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 transition-opacity" title="Average True Range measures market volatility over a 14-day window." />
              </span>
              <span className="font-mono font-bold text-sm text-text-primary block">₹{atr.toFixed(2)}</span>
              <span className="text-[8px] text-text-secondary/70 block">Daily price range</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default TechnicalIndicators;
