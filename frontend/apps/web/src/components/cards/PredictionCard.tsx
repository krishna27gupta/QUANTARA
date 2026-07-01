"use client";

import React from "react";
import { motion } from "framer-motion";
import { Compass, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PredictionCardProps {
  ticker: string;
  targetPrice: string;
  confidence: string;
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  daysAhead: number;
  className?: string;
}

export function PredictionCard({
  ticker,
  targetPrice,
  confidence,
  direction,
  daysAhead,
  className,
}: PredictionCardProps) {
  
  const directionColors = {
    BULLISH: "text-success bg-success/10",
    BEARISH: "text-danger bg-danger/10",
    NEUTRAL: "text-text-secondary bg-secondary/50",
  };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "var(--shadow-soft)" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "p-5 rounded-[20px] bg-card border border-border flex flex-col justify-between hover:border-accent/40 glass",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-sm font-mono text-text-primary">{ticker}</span>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg", directionColors[direction])}>
          {direction}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <span className="font-caption text-text-secondary">Predicted Target</span>
          <h4 className="text-xl font-bold font-mono text-text-primary">{targetPrice}</h4>
        </div>

        <div className="flex items-center justify-between text-xs border-t border-border/40 pt-3">
          <span className="text-text-secondary flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {daysAhead}d Target
          </span>
          <span className="font-semibold text-accent flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            {confidence} Conf.
          </span>
        </div>
      </div>
    </motion.div>
  );
}
export default PredictionCard;
