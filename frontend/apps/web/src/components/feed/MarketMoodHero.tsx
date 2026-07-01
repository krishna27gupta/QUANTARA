"use client";

import React from "react";
import { motion } from "framer-motion";
import { Counter } from "@/components/ui/Animate";
import { Sparkles, TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MarketMoodHeroProps {
  mood: "BULLISH" | "NEUTRAL" | "BEARISH";
  niftyOutlook: string;
  niftyUp?: boolean;
  opportunityScore: number;
  className?: string;
}

export function MarketMoodHero({
  mood,
  niftyOutlook,
  niftyUp = true,
  opportunityScore,
  className,
}: MarketMoodHeroProps) {
  
  const glows = {
    BULLISH: "shadow-[0_0_50px_-12px_rgba(34,197,94,0.3)] border-success/30 bg-gradient-to-br from-card via-card to-success/5",
    BEARISH: "shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)] border-danger/30 bg-gradient-to-br from-card via-card to-danger/5",
    NEUTRAL: "shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] border-accent/30 bg-gradient-to-br from-card via-card to-accent/5",
  };

  const moodTexts = {
    BULLISH: { text: "Bullish", emoji: "🟢", color: "text-success bg-success/15 border-success/20" },
    BEARISH: { text: "Bearish", emoji: "🔴", color: "text-danger bg-danger/15 border-danger/20" },
    NEUTRAL: { text: "Neutral", emoji: "🟡", color: "text-accent bg-accent/15 border-accent/20" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "p-6 md:p-8 rounded-[20px] bg-card border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden glass",
        glows[mood],
        className
      )}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-transparent to-white/5 rounded-full blur-3xl pointer-events-none" />

      {/* Mood details */}
      <div className="space-y-4 max-w-md">
        <div className="inline-flex items-center gap-1.5 text-xs text-accent font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-accent animate-pulse" />
          Morning Market Sentiment
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
            Market Mood is{" "}
            <span className={cn("inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-sm font-bold border ml-1", moodTexts[mood].color)}>
              {moodTexts[mood].emoji} {moodTexts[mood].text}
            </span>
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Overall indices show positive momentum, supported by banking index indicators. Focus on high-confidence long swing entries.
          </p>
        </div>

        <div className="flex items-center gap-6 pt-1">
          <div>
            <span className="text-[10px] text-text-secondary font-semibold uppercase block">NIFTY 50 Outlook</span>
            <span className={cn("text-base font-extrabold font-mono flex items-center gap-1", niftyUp ? "text-success" : "text-danger")}>
              {niftyUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {niftyOutlook}
            </span>
          </div>
          <div className="w-px h-8 bg-border/40" />
          <div>
            <span className="text-[10px] text-text-secondary font-semibold uppercase block">NSE Volatility (VIX)</span>
            <span className="text-base font-extrabold font-mono text-text-primary">12.45 (-2.1%)</span>
          </div>
        </div>
      </div>

      {/* Score gauge */}
      <div className="shrink-0 w-full md:w-auto p-6 rounded-2xl bg-secondary/15 border border-border/40 flex flex-col items-center justify-center text-center max-w-[200px] mx-auto md:mx-0">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r="40" stroke="var(--color-border)" strokeWidth="6" fill="transparent" />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke={mood === "BULLISH" ? "var(--color-success)" : mood === "BEARISH" ? "var(--color-danger)" : "var(--color-accent)"}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * opportunityScore) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute font-mono font-extrabold text-2xl text-text-primary">
            <Counter value={opportunityScore} />
          </span>
        </div>
        <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-3 flex items-center gap-1">
          Opportunity Score <HelpCircle className="w-3 h-3 text-text-secondary/50 cursor-pointer" />
        </span>
      </div>
    </motion.div>
  );
}
export default MarketMoodHero;
