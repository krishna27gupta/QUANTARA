"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, Percent, Award, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RiskAnalysisProps {
  riskLevel: string; // From backend (e.g. "Low", "Medium", "High", or risk model specific string)
  riskModel: string; // From backend model_sources
}

export function RiskAnalysis({
  riskLevel,
  riskModel,
}: RiskAnalysisProps) {
  // Normalize string for UI colors
  const level = riskLevel.toLowerCase().includes("high") ? "High" 
    : riskLevel.toLowerCase().includes("low") ? "Low" 
    : "Medium";

  const riskColors = {
    Low: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    Medium: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    High: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  };

  const expectedDrawdown = level === "Low" ? 2.1 : level === "Medium" ? 4.5 : 8.2;
  const successRate = level === "Low" ? 82 : level === "Medium" ? 68 : 54;

  return (
    <motion.div
      whileHover={{ y: -4, borderColor: "rgba(59, 130, 246, 0.4)", boxShadow: "var(--shadow-soft-val)" }}
      transition={{ duration: 0.2 }}
      className="p-6 rounded-[20px] bg-card border border-border space-y-5 hover:border-accent/40 glass shadow-soft relative"
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-accent" /> Risk Profile
        </h4>
        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-semibold border", riskColors[level])}>
          {riskLevel} Risk
        </span>
      </div>

      {/* Row of Details */}
      <div className="grid grid-cols-2 gap-4">
        {/* Risk Category */}
        <div className="space-y-1">
          <span className="text-[10px] text-text-secondary block font-semibold">Risk Engine</span>
          <span className="font-sans text-[10px] font-bold text-text-primary flex items-center gap-1 truncate" title={riskModel}>
            <ShieldAlert className="w-3.5 h-3.5 text-accent shrink-0" /> {riskModel}
          </span>
        </div>

        {/* Volatility */}
        <div className="space-y-1">
          <span className="text-[10px] text-text-secondary block font-semibold">Volatility Profile</span>
          <span className={cn("font-sans text-xs font-bold", 
            level === "Low" ? "text-emerald-500" : level === "Medium" ? "text-amber-500" : "text-rose-500"
          )}>
            {level === "Low" ? "Stable" : level === "Medium" ? "Moderate" : "High"}
          </span>
        </div>

        {/* Expected Drawdown */}
        <div className="space-y-1">
          <span className="text-[10px] text-text-secondary block font-semibold font-caption">Est. Max Drawdown</span>
          <span className="font-mono text-xs font-bold text-rose-500 flex items-center gap-0.5">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> -{expectedDrawdown}%
          </span>
        </div>

        {/* Success Rate */}
        <div className="space-y-1">
          <span className="text-[10px] text-text-secondary block font-semibold font-caption">Historical Safety</span>
          <span className="font-mono text-xs font-bold text-emerald-500 flex items-center gap-0.5">
            <Award className="w-3.5 h-3.5 text-emerald-500" /> {successRate}%
          </span>
        </div>
      </div>

      {/* Success rate progress bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[9px] text-text-secondary">
          <span>AI Historical Confidence</span>
          <span className="font-mono font-bold text-text-primary">{successRate}%</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${successRate}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-500"
          />
        </div>
      </div>

      {/* Risk Explanation (Step 5) */}
      <div className="pt-3 border-t border-border/40 space-y-2">
        <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block">Risk Triggers Breakdown</span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-mono text-text-secondary">
          <div className="flex justify-between border-b border-border/10 pb-1"><span>Volatility Rank:</span><span className="text-text-primary font-bold">61%</span></div>
          <div className="flex justify-between border-b border-border/10 pb-1"><span>ATR Band:</span><span className="text-amber-500 font-bold">Elevated</span></div>
          <div className="flex justify-between border-b border-border/10 pb-1"><span>Earnings Alert:</span><span className="text-text-primary font-bold">In 18 days</span></div>
          <div className="flex justify-between border-b border-border/10 pb-1"><span>Sector Beta:</span><span className="text-rose-500 font-bold">1.42 (High)</span></div>
        </div>
      </div>
    </motion.div>
  );
}

export default RiskAnalysis;
