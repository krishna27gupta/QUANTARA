"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, Lightbulb, PieChart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PortfolioAssistantCardProps {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export function PortfolioAssistantCard({
  strengths,
  weaknesses,
  recommendations,
}: PortfolioAssistantCardProps) {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card/60 glass shadow-sm space-y-4 max-w-full overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="p-1.5 rounded-lg bg-accent/15 text-accent border border-accent/25">
          <PieChart className="w-4 h-4" />
        </div>
        <div>
          <span className="font-caption text-[9px] text-text-secondary uppercase tracking-wider block">Health Report</span>
          <h4 className="font-bold text-xs text-text-primary">Portfolio Assistant Diagnostic</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Strengths */}
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
          </span>
          <ul className="space-y-1.5 pl-1">
            {strengths.map((s, idx) => (
              <li key={idx} className="text-[10px] text-text-primary/90 flex gap-1 items-start leading-relaxed">
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Weaknesses
          </span>
          <ul className="space-y-1.5 pl-1">
            {weaknesses.map((w, idx) => (
              <li key={idx} className="text-[10px] text-text-primary/90 flex gap-1 items-start leading-relaxed">
                <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2">
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5" /> Suggestions
          </span>
          <ul className="space-y-1.5 pl-1">
            {recommendations.map((r, idx) => (
              <li key={idx} className="text-[10px] text-text-primary/90 flex gap-1 items-start leading-relaxed">
                <span className="text-accent shrink-0 mt-0.5">→</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PortfolioAssistantCard;
