"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Award, Sparkles, Layers, DollarSign, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// Animated counter for floats and integers
function AnimatedNumber({ value, decimals = 0, prefix = "", suffix = "" }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800; // 0.8s
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = progress * (2 - progress); // Ease out quad
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
      {current.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export interface StockHeroProps {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  dailyChange: number; // e.g. +1.42 or -0.85
  volume: string;
  marketCap: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  profitProbability: number;
  expectedReturn: number; // e.g. +6.1 or -2.4
  score: number;
}

export function StockHero({
  ticker,
  name,
  sector,
  price,
  dailyChange,
  volume,
  marketCap,
  signal,
  confidence,
  profitProbability,
  expectedReturn,
  score,
}: StockHeroProps) {
  const isPositive = dailyChange >= 0;

  const signalConfigs = {
    BUY: {
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      gradient: "from-emerald-500/15 via-transparent to-transparent",
      badge: "bg-emerald-500 text-white",
    },
    SELL: {
      color: "text-rose-500",
      bg: "bg-rose-500/10 border-rose-500/20",
      gradient: "from-rose-500/15 via-transparent to-transparent",
      badge: "bg-rose-500 text-white",
    },
    HOLD: {
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
      gradient: "from-amber-500/15 via-transparent to-transparent",
      badge: "bg-amber-500 text-white",
    },
  };

  const config = signalConfigs[signal];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 md:p-8 glass shadow-soft hover:border-accent/20 transition-all duration-300"
    >
      {/* Glow Effect matching signal */}
      <div className={cn("absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-50 bg-gradient-to-br", config.gradient)} />
      <div className="absolute top-0 right-0 w-44 h-44 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        {/* Left Section: Company Name, Price */}
        <div className="space-y-3.5 w-full lg:w-auto">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-text-secondary/70 bg-secondary/60 px-2.5 py-0.5 rounded-full uppercase">
                {sector}
              </span>
              <span className="text-[10px] text-text-secondary font-semibold">|</span>
              <span className="text-[10px] text-text-secondary">Vol: {volume}</span>
              <span className="text-[10px] text-text-secondary">|</span>
              <span className="text-[10px] text-text-secondary">Cap: {marketCap}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">{ticker}</h1>
              <p className="text-xs md:text-sm text-text-secondary">{name}</p>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-3.5">
            <span className="text-3xl md:text-4xl font-mono font-bold text-text-primary">
              ₹<AnimatedNumber value={price} decimals={2} />
            </span>
            <div className={cn(
              "flex items-center gap-1 text-xs md:text-sm font-bold px-2 py-0.5 rounded-lg",
              isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>
                <AnimatedNumber value={Math.abs(dailyChange)} decimals={2} prefix={isPositive ? "+" : "-"} suffix="%" />
              </span>
            </div>
          </div>
        </div>

        {/* Mid Section: AI Signal Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 xl:gap-8 w-full lg:w-auto border-t lg:border-t-0 border-border/30 pt-4 lg:pt-0">
          
          {/* Signal Indicator */}
          <div className="flex flex-col">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">AI Recommendation</span>
            <div className={cn(
              "text-lg font-black px-4 py-1.5 rounded-xl border mt-1.5 text-center min-w-[80px]",
              config.color,
              config.bg
            )}>
              {signal}
            </div>
          </div>

          {/* Expected Return */}
          <div className="flex flex-col">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Exp. Return</span>
            <div className={cn(
              "text-lg font-mono font-bold mt-2 flex items-center gap-0.5",
              expectedReturn >= 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              {expectedReturn >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <AnimatedNumber value={expectedReturn} decimals={1} suffix="%" />
            </div>
          </div>

          {/* Profit Probability */}
          <div className="flex flex-col">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Profit Prob.</span>
            <span className="text-lg font-mono font-bold text-text-primary mt-2">
              <AnimatedNumber value={profitProbability} suffix="%" />
            </span>
          </div>

          {/* Confidence */}
          <div className="flex flex-col">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Confidence</span>
            <span className="text-lg font-mono font-bold text-text-primary mt-2">
              <AnimatedNumber value={confidence} suffix="%" />
            </span>
          </div>
        </div>

        {/* Right Section: Quantara Score Circle/Metric */}
        <div className="flex items-center gap-3.5 bg-accent/5 border border-accent/10 hover:border-accent/30 rounded-2xl p-4 w-full lg:w-48 shrink-0 select-none group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-15 transition-opacity">
            <Award className="w-12 h-12 text-accent" />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] text-accent uppercase tracking-wider block font-bold">Quantara Score</span>
            <div className="flex items-baseline mt-0.5">
              <span className="text-xl font-mono font-black text-text-primary">
                <AnimatedNumber value={score} />
              </span>
              <span className="text-xs text-text-secondary">/100</span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default StockHero;
