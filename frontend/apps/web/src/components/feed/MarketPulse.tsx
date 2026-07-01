"use client";

import React from "react";
import { motion } from "framer-motion";
import { Smile, Compass, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MarketPulseProps {
  summary: string;
  fearAndGreed: number;
  volatility: string;
  bestSectors: string[];
  worstSectors: string[];
  className?: string;
}

export function MarketPulse({
  summary,
  fearAndGreed,
  volatility,
  bestSectors,
  worstSectors,
  className,
}: MarketPulseProps) {
  
  const getFearGreedText = (val: number) => {
    if (val > 75) return "Extreme Greed";
    if (val > 55) return "Greed";
    if (val > 45) return "Neutral";
    if (val > 25) return "Fear";
    return "Extreme Fear";
  };

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
      
      {/* Perplexity-style AI Summary Card */}
      <motion.div
        whileHover={{ y: -2 }}
        className="lg:col-span-2 p-6 rounded-[20px] bg-card border border-border space-y-4 glass shadow-soft relative overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-accent">
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <span className="font-bold text-xs uppercase tracking-wider">Quantara AI Market Intelligence</span>
          </div>
          <p className="text-xs text-text-primary/95 leading-relaxed font-body">
            {summary}
          </p>
        </div>

        <div className="pt-4 border-t border-border/30 flex items-center justify-between text-[10px] text-text-secondary font-semibold">
          <span>Sources: NSE Daily Feeds • Derivative Option Chains</span>
          <span className="text-accent cursor-pointer hover:underline">Read Full Deep Dive</span>
        </div>
      </motion.div>

      {/* Market Pulse Stats Column */}
      <motion.div
        whileHover={{ y: -2 }}
        className="p-6 rounded-[20px] bg-card border border-border space-y-4 glass shadow-soft"
      >
        <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block border-b border-border/40 pb-2">
          Market Pulse
        </span>

        <div className="space-y-3.5 text-xs">
          {/* Fear and Greed */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-text-secondary flex items-center gap-1">
                <Smile className="w-3.5 h-3.5 text-accent" /> Fear & Greed Index
              </span>
              <span className="text-text-primary font-bold">{fearAndGreed} ({getFearGreedText(fearAndGreed)})</span>
            </div>
            <div className="w-full h-1.5 bg-secondary/40 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: `${fearAndGreed}%` }} />
            </div>
          </div>

          {/* Volatility */}
          <div className="flex justify-between font-semibold">
            <span className="text-text-secondary flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-accent" /> Volatility VIX
            </span>
            <span className="text-text-primary font-mono font-bold">{volatility}</span>
          </div>

          {/* Best Sectors */}
          <div className="space-y-1">
            <span className="text-[9px] text-text-secondary font-bold uppercase flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-success" /> Leading Sectors
            </span>
            <div className="flex flex-wrap gap-1.5">
              {bestSectors.map((sec, idx) => (
                <span key={idx} className="text-[9px] px-2 py-0.5 rounded bg-success/10 text-success border border-success/15 font-semibold">
                  {sec}
                </span>
              ))}
            </div>
          </div>

          {/* Worst Sectors */}
          <div className="space-y-1">
            <span className="text-[9px] text-text-secondary font-bold uppercase flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-danger" /> Lagging Sectors
            </span>
            <div className="flex flex-wrap gap-1.5">
              {worstSectors.map((sec, idx) => (
                <span key={idx} className="text-[9px] px-2 py-0.5 rounded bg-danger/10 text-danger border border-danger/15 font-semibold">
                  {sec}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
export default MarketPulse;
