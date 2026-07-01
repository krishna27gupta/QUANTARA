"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronDown, HelpCircle, TrendingUp, TrendingDown, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RationaleItem {
  id: string;
  title: string;
  shortDesc: string;
  explanation: string;
}

export interface AIResponseCardProps {
  ticker: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  profitProbability: number;
  expectedReturn: string;
  risk: "Low" | "Medium" | "High";
  rationales: RationaleItem[];
}

export function AIResponseCard({
  ticker,
  signal,
  confidence,
  profitProbability,
  expectedReturn,
  risk,
  rationales,
}: AIResponseCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const signalColors = {
    BUY: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    SELL: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    HOLD: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  };

  const isReturnPositive = !expectedReturn.startsWith("-");

  return (
    <div className="p-5 rounded-2xl border border-border bg-card/60 glass shadow-sm space-y-4 max-w-full overflow-hidden text-xs">
      {/* Ticker & Signal Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-text-primary">{ticker}</span>
          <span className="text-[10px] text-text-secondary">AI Diagnostic</span>
        </div>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg border", signalColors[signal])}>
          {signal} Recommendation
        </span>
      </div>

      {/* Main Core Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/20 p-3.5 rounded-xl border border-border/30">
        <div>
          <span className="text-[9px] text-text-secondary block font-semibold uppercase">Confidence</span>
          <span className="font-mono text-xs font-bold text-text-primary mt-0.5 block">{confidence}%</span>
        </div>
        <div>
          <span className="text-[9px] text-text-secondary block font-semibold uppercase">Profit Prob.</span>
          <span className="font-mono text-xs font-bold text-text-primary mt-0.5 block">{profitProbability}%</span>
        </div>
        <div>
          <span className="text-[9px] text-text-secondary block font-semibold uppercase">Expected Return</span>
          <span className={cn("font-mono text-xs font-bold flex items-center gap-0.5 mt-0.5",
            isReturnPositive ? "text-emerald-500" : "text-rose-500"
          )}>
            {isReturnPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {expectedReturn}
          </span>
        </div>
        <div>
          <span className="text-[9px] text-text-secondary block font-semibold uppercase">Risk Profile</span>
          <span className={cn("font-bold text-[10px] block mt-0.5",
            risk === "Low" ? "text-emerald-500" : risk === "Medium" ? "text-amber-500" : "text-rose-500"
          )}>
            {risk}
          </span>
        </div>
      </div>

      {/* Rationale Checklist (Why?) */}
      <div className="space-y-2">
        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-accent" /> Why recommend this?
        </span>
        <div className="space-y-1.5">
          {rationales.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="border border-border/20 hover:border-accent/20 bg-secondary/5 hover:bg-secondary/15 rounded-lg overflow-hidden cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between p-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-bold text-[11px] text-text-primary block leading-none">{item.title}</span>
                      <span className="text-[9px] text-text-secondary mt-0.5 block">{item.shortDesc}</span>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-text-secondary"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </motion.div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="border-t border-border/20 bg-secondary/10 p-3"
                    >
                      <p className="text-[10px] text-text-primary/90 leading-relaxed font-body">
                        {item.explanation}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AIResponseCard;
