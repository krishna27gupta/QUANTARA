"use client";

import React from "react";
import { GitCompare, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompareAsset {
  ticker: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  expectedReturn: string;
  risk: "Low" | "Medium" | "High";
}

export interface ComparisonCardProps {
  assetA: CompareAsset;
  assetB: CompareAsset;
  recommendationText: string;
}

export function ComparisonCard({
  assetA,
  assetB,
  recommendationText,
}: ComparisonCardProps) {
  const getSignalBadge = (sig: "BUY" | "SELL" | "HOLD") => {
    const styles = {
      BUY: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      SELL: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      HOLD: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    };
    return (
      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border", styles[sig])}>
        {sig}
      </span>
    );
  };

  const getRiskColor = (risk: "Low" | "Medium" | "High") => {
    return risk === "Low" ? "text-emerald-500" : risk === "Medium" ? "text-amber-500" : "text-rose-500";
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-card/60 glass shadow-sm space-y-4 max-w-full overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="p-1.5 rounded-lg bg-accent/15 text-accent border border-accent/25">
          <GitCompare className="w-4 h-4" />
        </div>
        <div>
          <span className="font-caption text-[9px] text-text-secondary uppercase tracking-wider block">Comparison Matrix</span>
          <h4 className="font-bold text-xs text-text-primary">{assetA.ticker} vs {assetB.ticker}</h4>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="border border-border/40 rounded-xl overflow-hidden bg-secondary/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/40 bg-secondary/20 font-semibold text-text-secondary text-[10px]">
              <th className="p-2.5">Parameter</th>
              <th className="p-2.5 font-mono font-bold text-text-primary">{assetA.ticker}</th>
              <th className="p-2.5 font-mono font-bold text-text-primary">{assetB.ticker}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20 text-[10px]">
            <tr>
              <td className="p-2.5 text-text-secondary font-medium">AI Signal</td>
              <td className="p-2.5">{getSignalBadge(assetA.signal)}</td>
              <td className="p-2.5">{getSignalBadge(assetB.signal)}</td>
            </tr>
            <tr>
              <td className="p-2.5 text-text-secondary font-medium">Confidence</td>
              <td className="p-2.5 font-mono font-semibold text-text-primary">{assetA.confidence}%</td>
              <td className="p-2.5 font-mono font-semibold text-text-primary">{assetB.confidence}%</td>
            </tr>
            <tr>
              <td className="p-2.5 text-text-secondary font-medium">Exp. Return</td>
              <td className={cn("p-2.5 font-mono font-semibold", !assetA.expectedReturn.startsWith("-") ? "text-emerald-500" : "text-rose-500")}>
                {assetA.expectedReturn}
              </td>
              <td className={cn("p-2.5 font-mono font-semibold", !assetB.expectedReturn.startsWith("-") ? "text-emerald-500" : "text-rose-500")}>
                {assetB.expectedReturn}
              </td>
            </tr>
            <tr>
              <td className="p-2.5 text-text-secondary font-medium">Risk Level</td>
              <td className={cn("p-2.5 font-semibold", getRiskColor(assetA.risk))}>{assetA.risk}</td>
              <td className={cn("p-2.5 font-semibold", getRiskColor(assetB.risk))}>{assetB.risk}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Rationale recommendation paragraph */}
      <div className="bg-accent/5 border border-accent/15 rounded-xl p-3 text-[10px] text-text-secondary leading-relaxed">
        <span className="text-text-primary font-semibold block mb-0.5">AI Comparison Recommendation:</span>
        {recommendationText}
      </div>
    </div>
  );
}

export default ComparisonCard;
