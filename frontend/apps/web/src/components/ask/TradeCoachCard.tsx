"use client";

import React from "react";
import { Sparkles, HelpCircle, ShieldAlert, Award, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TradeCoachCardProps {
  action: "ENTER NOW" | "HOLD POSITION" | "BOOK PROFITS" | "EXIT SETUP";
  reasoning: string;
  risk: "Low" | "Medium" | "High";
  expectedOutcome: string;
}

export function TradeCoachCard({
  action,
  reasoning,
  risk,
  expectedOutcome,
}: TradeCoachCardProps) {
  const actionStyles = {
    "ENTER NOW": "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    "HOLD POSITION": "text-blue-500 bg-blue-500/10 border-blue-500/20",
    "BOOK PROFITS": "text-amber-500 bg-amber-500/10 border-amber-500/20",
    "EXIT SETUP": "text-rose-500 bg-rose-500/10 border-rose-500/20",
  };

  const riskColor = risk === "Low" ? "text-emerald-500" : risk === "Medium" ? "text-amber-500" : "text-rose-500";

  return (
    <div className="p-5 rounded-2xl border border-border bg-card/60 glass shadow-sm space-y-4 max-w-full overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <Award className="w-4 h-4" />
        </div>
        <div>
          <span className="font-caption text-[9px] text-text-secondary uppercase tracking-wider block">Mentor Coaching</span>
          <h4 className="font-bold text-xs text-text-primary">Trade Advisor Coach</h4>
        </div>
      </div>

      {/* Suggested Action Banner */}
      <div className="space-y-1">
        <span className="text-[9px] text-text-secondary uppercase tracking-wider font-semibold">Recommended Action</span>
        <div className={cn("text-xs font-black px-3.5 py-2 rounded-xl border text-center font-sans tracking-wide", actionStyles[action])}>
          {action}
        </div>
      </div>

      {/* Reasoning and outcomes grid */}
      <div className="space-y-3">
        <div className="space-y-1">
          <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-accent" /> Rationale Reasoning
          </span>
          <p className="text-[10px] text-text-primary/95 leading-relaxed font-body">
            {reasoning}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
          <div>
            <span className="text-[9px] text-text-secondary block">Coaching Risk Level</span>
            <span className={cn("font-bold text-[10px] block mt-0.5", riskColor)}>
              {risk}
            </span>
          </div>

          <div>
            <span className="text-[9px] text-text-secondary block">Expected Outcome</span>
            <span className="font-semibold text-text-primary text-[10px] block mt-0.5">
              {expectedOutcome}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradeCoachCard;
