"use client";

import React from "react";
import { motion } from "framer-motion";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SentimentCardProps {
  ticker: string;
  bullish: number;
  bearish: number;
  neutral: number;
  className?: string;
}

export function SentimentCard({
  ticker,
  bullish,
  bearish,
  neutral,
  className,
}: SentimentCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "var(--shadow-soft)" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "p-6 rounded-[20px] bg-card border border-border space-y-4 hover:border-accent/40 glass",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h4 className="font-bold text-sm text-text-primary">Market Sentiment: {ticker}</h4>
        <Smile className="w-4 h-4 text-accent" />
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-success">Bullish</span>
            <span className="font-mono text-text-primary">{bullish}%</span>
          </div>
          <div className="w-full h-2 bg-secondary/35 rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: `${bullish}%` }} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-danger">Bearish</span>
            <span className="font-mono text-text-primary">{bearish}%</span>
          </div>
          <div className="w-full h-2 bg-secondary/35 rounded-full overflow-hidden">
            <div className="h-full bg-danger rounded-full" style={{ width: `${bearish}%` }} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-text-secondary">Neutral</span>
            <span className="font-mono text-text-primary">{neutral}%</span>
          </div>
          <div className="w-full h-2 bg-secondary/35 rounded-full overflow-hidden">
            <div className="h-full bg-text-secondary rounded-full" style={{ width: `${neutral}%` }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
export default SentimentCard;
