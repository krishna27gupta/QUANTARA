"use client";

import React from "react";
import { motion } from "framer-motion";
import { Smile, MessageSquare, Landmark, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SentimentAnalysisProps {
  news: "Positive" | "Neutral" | "Negative";
  social: "Bullish" | "Neutral" | "Bearish";
  sector: "Bullish" | "Neutral" | "Bearish";
  overall: number; // 0-100 scale
}

export function SentimentAnalysis({
  news,
  social,
  sector,
  overall,
}: SentimentAnalysisProps) {
  const getBadgeStyle = (val: string) => {
    if (val === "Positive" || val === "Bullish") {
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    }
    if (val === "Negative" || val === "Bearish") {
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
          <Smile className="w-4 h-4 text-accent" /> Sentiment Pulse
        </h4>
        <span className="text-[9px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
          Crowd & News
        </span>
      </div>

      {/* Row of Details */}
      <div className="grid grid-cols-3 gap-2 py-1">
        {/* News Sentiment */}
        <div className="space-y-1 text-center">
          <span className="text-[10px] text-text-secondary block font-semibold flex items-center justify-center gap-1">
            <Landmark className="w-3 h-3 text-accent" /> News
          </span>
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block mt-0.5", getBadgeStyle(news))}>
            {news}
          </span>
        </div>

        {/* Social Sentiment */}
        <div className="space-y-1 text-center">
          <span className="text-[10px] text-text-secondary block font-semibold flex items-center justify-center gap-1">
            <MessageSquare className="w-3 h-3 text-purple-400" /> Social
          </span>
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block mt-0.5", getBadgeStyle(social))}>
            {social}
          </span>
        </div>

        {/* Sector Sentiment */}
        <div className="space-y-1 text-center">
          <span className="text-[10px] text-text-secondary block font-semibold flex items-center justify-center gap-1">
            <HeartHandshake className="w-3 h-3 text-blue-400" /> Sector
          </span>
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block mt-0.5", getBadgeStyle(sector))}>
            {sector}
          </span>
        </div>
      </div>

      {/* Aggregate Score Bar */}
      <div className="space-y-1.5 pt-2 border-t border-border/30">
        <div className="flex justify-between text-[10px] text-text-secondary">
          <span className="font-semibold">Aggregate Sentiment Score</span>
          <span className="font-mono font-bold text-text-primary">{overall}/100</span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${overall}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn("h-full rounded-full",
              overall >= 70 ? "bg-gradient-to-r from-amber-500 to-emerald-500" :
              overall >= 50 ? "bg-gradient-to-r from-rose-500 to-amber-500" :
              "bg-rose-500"
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default SentimentAnalysis;
