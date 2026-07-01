"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, ShieldAlert, PieChart, Clock, Target, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TradeSetupProps {
  entryMin: number;
  entryMax: number;
  targetPrice: number;
  stopLossPrice: number;
  riskReward: string; // e.g. "1:3"
  capitalAllocation: number; // e.g. 15
  holdingPeriod: string; // e.g. "5–7 days"
}

export function TradeSetup({
  entryMin,
  entryMax,
  targetPrice,
  stopLossPrice,
  riskReward,
  capitalAllocation,
  holdingPeriod,
}: TradeSetupProps) {
  return (
    <motion.div
      whileHover={{ y: -4, borderColor: "rgba(59, 130, 246, 0.4)", boxShadow: "var(--shadow-soft-val)" }}
      transition={{ duration: 0.2 }}
      className="p-6 rounded-[20px] bg-card border border-border space-y-5 hover:border-accent/40 glass shadow-soft relative"
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
          <Target className="w-4 h-4 text-accent" /> Trade Setup
        </h4>
        <span className="text-[9px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
          Optimal Entry
        </span>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <span className="text-[10px] text-text-secondary block font-semibold">Entry Range</span>
          <span className="font-mono text-xs md:text-sm font-bold text-text-primary">
            ₹{entryMin.toLocaleString("en-IN")} - ₹{entryMax.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="space-y-1 text-center">
          <span className="text-[10px] text-text-secondary block font-semibold">Exit Target</span>
          <span className="font-mono text-xs md:text-sm font-bold text-emerald-500 flex items-center justify-center gap-0.5">
            <ArrowRight className="w-3 h-3" /> ₹{targetPrice.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="space-y-1 text-right">
          <span className="text-[10px] text-text-secondary block font-semibold">Stop Loss</span>
          <span className="font-mono text-xs md:text-sm font-bold text-rose-500">
            ₹{stopLossPrice.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Risk-reward, allocation, and holding */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <span className="text-[9px] text-text-secondary block leading-none">R:R Ratio</span>
            <span className="font-mono text-xs font-bold text-text-primary block mt-0.5">{riskReward}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 justify-center">
          <PieChart className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <span className="text-[9px] text-text-secondary block leading-none">Capital Alloc.</span>
            <span className="font-mono text-xs font-bold text-text-primary block mt-0.5">{capitalAllocation}%</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 justify-end">
          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="text-right">
            <span className="text-[9px] text-text-secondary block leading-none">Holding Period</span>
            <span className="font-mono text-xs font-bold text-text-primary block mt-0.5">{holdingPeriod}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default TradeSetup;
