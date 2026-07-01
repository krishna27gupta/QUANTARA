"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RecommendationCardProps {
  ticker: string;
  type: "BUY" | "SELL" | "HOLD";
  reason: string;
  score: string;
  className?: string;
}

export function RecommendationCard({
  ticker,
  type,
  reason,
  score,
  className,
}: RecommendationCardProps) {
  
  const typeColors = {
    BUY: "bg-success/15 text-success border-success/30",
    SELL: "bg-danger/15 text-danger border-danger/30",
    HOLD: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "var(--shadow-soft)" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "p-6 rounded-[20px] bg-card border border-border flex flex-col justify-between hover:border-accent/40 glass relative overflow-hidden",
        className
      )}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none" />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base font-mono text-text-primary">{ticker}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/60 text-text-secondary font-semibold">
              NSE
            </span>
          </div>
          <span className={cn("text-xs font-bold px-3 py-1 rounded-xl border", typeColors[type])}>
            {type}
          </span>
        </div>

        <p className="text-xs text-text-secondary/90 leading-relaxed font-body">
          {reason}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-6">
        <div className="flex items-center gap-1 text-xs text-accent font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Quant Score: {score}</span>
        </div>
        <span className="text-[10px] text-text-secondary flex items-center gap-1 group cursor-pointer hover:text-text-primary">
          Details <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </motion.div>
  );
}
export default RecommendationCard;
