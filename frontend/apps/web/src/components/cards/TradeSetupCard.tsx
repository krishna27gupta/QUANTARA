"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TradeSetupCardProps {
  ticker: string;
  entry: string;
  target: string;
  stopLoss: string;
  riskReward: string;
  className?: string;
}

export function TradeSetupCard({
  ticker,
  entry,
  target,
  stopLoss,
  riskReward,
  className,
}: TradeSetupCardProps) {
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
        <h4 className="font-bold text-sm text-text-primary">Trade Setup: {ticker}</h4>
        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-success/15 text-success font-semibold border border-success/20">
          Optimal Risk
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 py-1">
        <div className="space-y-1">
          <span className="text-[10px] text-text-secondary block font-semibold">Entry Range</span>
          <span className="font-mono text-sm font-bold text-text-primary">{entry}</span>
        </div>
        <div className="space-y-1 text-center">
          <span className="text-[10px] text-text-secondary block font-semibold">Exit Target</span>
          <span className="font-mono text-sm font-bold text-success flex items-center justify-center gap-0.5">
            <ArrowRight className="w-3 h-3" /> {target}
          </span>
        </div>
        <div className="space-y-1 text-right">
          <span className="text-[10px] text-text-secondary block font-semibold">Stop Loss</span>
          <span className="font-mono text-sm font-bold text-danger">{stopLoss}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
        <span className="text-text-secondary flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          R:R Ratio
        </span>
        <span className="font-mono font-bold text-text-primary">{riskReward}</span>
      </div>
    </motion.div>
  );
}
export default TradeSetupCard;
