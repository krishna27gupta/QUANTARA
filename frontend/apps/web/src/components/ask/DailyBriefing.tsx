"use client";

import React from "react";
import { Sun, ShieldAlert, Award, Flame, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BriefTrade {
  rank: number;
  ticker: string;
  confidence: number;
  expectedReturn: string;
  risk: "Low" | "Medium" | "High";
}

export interface DailyBriefingProps {
  marketOutlook: "Bullish" | "Neutral" | "Bearish";
  recommendedTrades: BriefTrade[];
  onSelectTrade?: (ticker: string) => void;
}

export function DailyBriefing({
  marketOutlook = "Bullish",
  recommendedTrades,
  onSelectTrade,
}: DailyBriefingProps) {
  const moodStyles = {
    Bullish: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    Neutral: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    Bearish: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <div className="p-5 rounded-[20px] bg-card border border-border glass shadow-soft hover:border-accent/20 transition-all space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/25">
            <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
          </div>
          <div>
            <span className="font-caption text-[9px] text-text-secondary uppercase tracking-wider block font-bold">Morning Bulletin</span>
            <h4 className="font-bold text-xs text-text-primary">Daily Briefing</h4>
          </div>
        </div>
        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-lg border", moodStyles[marketOutlook])}>
          {marketOutlook} Outlook
        </span>
      </div>

      {/* Suggested trades list */}
      <div className="space-y-2.5">
        <span className="text-[10px] text-text-secondary font-semibold uppercase block">
          Today&apos;s Recommended Trades
        </span>
        <div className="space-y-2">
          {recommendedTrades.map((t) => (
            <div
              key={t.ticker}
              onClick={() => onSelectTrade && onSelectTrade(t.ticker)}
              className="p-3 rounded-xl bg-secondary/20 border border-border/40 hover:border-accent/30 hover:bg-secondary/35 cursor-pointer flex justify-between items-center group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-xs text-text-primary w-4">{t.rank}.</span>
                <div>
                  <span className="font-mono font-bold text-xs text-text-primary block leading-none">{t.ticker}</span>
                  <span className="text-[8px] text-text-secondary block mt-1">Confidence: {t.confidence}%</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-xs text-emerald-500 block leading-none">{t.expectedReturn}</span>
                <span className={cn("text-[8px] font-semibold block mt-1",
                  t.risk === "Low" ? "text-emerald-500" : t.risk === "Medium" ? "text-amber-500" : "text-rose-500"
                )}>
                  {t.risk} Risk
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DailyBriefing;
