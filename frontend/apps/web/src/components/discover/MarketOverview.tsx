"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Activity, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Animated counter utility for integers and floats
function AnimatedValue({ value, decimals = 0, prefix = "", suffix = "" }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const start = 0;
    const duration = 1000; // 1 second
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quad formula
      const easeProgress = progress * (2 - progress);
      const val = start + easeProgress * (value - start);
      setCurrent(val);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrent(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {prefix}
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export interface MarketOverviewProps {
  mood?: "Bullish" | "Neutral" | "Bearish";
  niftyPred?: number; // e.g. 0.8
  fearGreed?: number; // e.g. 67
  volatility?: "Low" | "Medium" | "High";
  oppScore?: number;
  isLoading?: boolean;
}

export function MarketOverview({
  mood = "Bullish",
  niftyPred = 0.8,
  fearGreed = 67,
  volatility = "Low",
  oppScore,
  isLoading = false,
}: MarketOverviewProps) {
  // Glow colors based on mood
  const moodConfig = {
    Bullish: {
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      gradient: "from-emerald-500/20 via-transparent to-transparent",
      desc: "Market breadth and volumes support upward momentum.",
    },
    Neutral: {
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      gradient: "from-amber-500/20 via-transparent to-transparent",
      desc: "Indecision among major indices. Sector rotation active.",
    },
    Bearish: {
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      gradient: "from-rose-500/20 via-transparent to-transparent",
      desc: "Selling pressure evident in large caps. Hedging recommended.",
    },
  };

  const currentMood = moodConfig[mood];

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-[20px] border border-border bg-card p-6 glass shadow-soft">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-3 w-28 bg-border/40 rounded animate-pulse" />
              <div className="h-6 w-36 bg-border/40 rounded animate-pulse" />
            </div>
            <div className="h-6 w-24 bg-border/40 rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 h-24 rounded-2xl bg-secondary/20 border border-border/20 animate-pulse flex flex-col justify-between">
                <div className="h-3 w-16 bg-border/40 rounded" />
                <div className="h-6 w-12 bg-border/40 rounded mt-2" />
                <div className="h-2 w-full bg-border/20 rounded mt-1" />
              </div>
            ))}
          </div>
          <div className="h-10 w-full bg-secondary/20 border border-border/20 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-[20px] border border-border bg-card p-6 glass shadow-soft hover:border-accent/30 transition-colors duration-300 animate-fade-in"
    >
      {/* Decorative mood-based glow */}
      <div className={cn("absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl opacity-50 bg-gradient-to-br", currentMood.gradient)} />
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
 
      <div className="relative z-10 space-y-6">
        {/* Title & Info */}
        <div className="flex justify-between items-start">
          <div>
            <span className="font-caption text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-accent" /> Live Market Context
            </span>
            <h3 className="text-xl font-bold mt-1 text-text-primary">Market Pulse</h3>
          </div>
          <div className={cn("px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5", currentMood.bg, currentMood.color, currentMood.border)}>
            <span className="relative flex h-2 w-2">
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", mood === "Bullish" ? "bg-emerald-400" : mood === "Bearish" ? "bg-rose-400" : "bg-amber-400")}></span>
              <span className={cn("relative inline-flex rounded-full h-2 w-2", mood === "Bullish" ? "bg-emerald-500" : mood === "Bearish" ? "bg-rose-500" : "bg-amber-500")}></span>
            </span>
            {mood} Mood
          </div>
        </div>

        {/* Overview Core Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* NIFTY Prediction */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-secondary/40 transition-colors flex flex-col justify-between">
            <span className="text-xs text-text-secondary">NIFTY 50 Predict</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={cn("text-2xl font-mono font-bold", niftyPred >= 0 ? "text-emerald-500" : "text-rose-500")}>
                <AnimatedValue value={niftyPred} decimals={1} prefix={niftyPred >= 0 ? "+" : ""} suffix="%" />
              </span>
              <TrendingUp className={cn("w-4 h-4", niftyPred >= 0 ? "text-emerald-500" : "text-rose-500 rotate-180")} />
            </div>
            <span className="text-[10px] text-text-secondary mt-1 font-caption">Next 24h expected</span>
          </div>

          {/* Fear & Greed Index */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-secondary/40 transition-colors flex flex-col justify-between">
            <span className="text-xs text-text-secondary">Fear & Greed Index</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-text-primary">
                <AnimatedValue value={fearGreed} />
              </span>
              <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded", 
                fearGreed >= 75 ? "bg-emerald-500/10 text-emerald-500" :
                fearGreed >= 55 ? "bg-emerald-500/10 text-emerald-400" :
                fearGreed >= 45 ? "bg-amber-500/10 text-amber-500" :
                "bg-rose-500/10 text-rose-500"
              )}>
                {fearGreed >= 75 ? "Extreme Greed" :
                 fearGreed >= 55 ? "Greed" :
                 fearGreed >= 45 ? "Neutral" :
                 "Fear"}
              </span>
            </div>
            {/* Tiny progress bar */}
            <div className="w-full h-1 bg-border rounded-full mt-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${fearGreed}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn("h-full rounded-full", 
                  fearGreed >= 55 ? "bg-gradient-to-r from-amber-500 to-emerald-500" : 
                  "bg-gradient-to-r from-rose-500 to-amber-500"
                )}
              />
            </div>
          </div>

          {/* Volatility */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-secondary/40 transition-colors flex flex-col justify-between">
            <span className="text-xs text-text-secondary">Volatility (VIX)</span>
            <div className="mt-2">
              <span className={cn("text-2xl font-bold", 
                volatility === "Low" ? "text-emerald-500" :
                volatility === "Medium" ? "text-amber-500" :
                "text-rose-500"
              )}>
                {volatility}
              </span>
            </div>
            <span className="text-[10px] text-text-secondary mt-1 font-caption">Ideal for swing options</span>
          </div>

          {/* Market Opportunity Score */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 hover:border-accent/40 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <span className="text-xs text-accent font-semibold flex items-center gap-1">
              Opportunity Score
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-mono font-extrabold text-text-primary">
                <AnimatedValue value={oppScore ?? 0} />
              </span>
              <span className="text-xs text-text-secondary font-semibold">/100</span>
            </div>
            <span className="text-[10px] text-accent/80 mt-1 font-medium">Strong entry setups detected</span>
          </div>
        </div>

        {/* Narrative Description / Tip */}
        <div className="flex gap-2.5 items-start bg-secondary/10 border border-border/30 rounded-xl p-3 text-xs text-text-secondary">
          <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            <span className="text-text-primary font-semibold">AI Scan Status:</span> {currentMood.desc} Sector rotation suggests high strength in <span className="text-accent font-semibold">Banking</span> and <span className="text-accent font-semibold">IT</span>.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default MarketOverview;
