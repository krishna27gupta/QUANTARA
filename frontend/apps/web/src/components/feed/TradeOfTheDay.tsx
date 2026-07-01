"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Sparkles, CheckCircle2, ChevronDown, ChevronUp, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface TradeOfTheDayProps {
  ticker: string;
  name: string;
  price: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: string;
  probability: string;
  expectedReturn: string;
  entry: string;
  target: string;
  stopLoss: string;
  riskReward: string;
  reasons: string[];
  className?: string;
}

export function TradeOfTheDay({
  ticker,
  name,
  price,
  signal,
  confidence,
  probability,
  expectedReturn,
  entry,
  target,
  stopLoss,
  riskReward,
  reasons,
  className,
}: TradeOfTheDayProps) {
  const [expanded, setExpanded] = useState(false);

  const signalColors = {
    BUY: "text-success bg-success/15 border-success/20",
    SELL: "text-danger bg-danger/15 border-danger/20",
    HOLD: "text-amber-500 bg-amber-500/15 border-amber-500/20",
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "p-6 rounded-[20px] bg-card border border-border/80 flex flex-col justify-between hover:border-accent/40 glass shadow-soft relative overflow-hidden",
        className
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

      {/* Main Row */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-accent/15 border border-accent/25 text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              Trade of the Day
            </span>
            <span className="text-[10px] text-text-secondary font-mono bg-secondary/50 px-2 py-1 rounded-lg border border-border/30">
              NSE
            </span>
          </div>
          <span className={cn("text-xs font-bold px-3 py-1 rounded-xl border", signalColors[signal])}>
            {signal}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-2xl font-extrabold font-mono text-text-primary tracking-tight">{ticker}</h3>
            <span className="text-xs text-text-secondary leading-none">{name}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-text-secondary block font-semibold uppercase">Current Price</span>
            <span className="text-lg font-bold font-mono text-text-primary">{price}</span>
          </div>
        </div>

        {/* Quant parameters */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/40 text-center">
          <div>
            <span className="text-[10px] text-text-secondary block font-semibold uppercase">Expected Return</span>
            <span className="text-sm font-extrabold text-success font-mono mt-0.5 block">{expectedReturn}</span>
          </div>
          <div>
            <span className="text-[10px] text-text-secondary block font-semibold uppercase">Profit Prob.</span>
            <span className="text-sm font-extrabold text-text-primary font-mono mt-0.5 block">{probability}</span>
          </div>
          <div>
            <span className="text-[10px] text-text-secondary block font-semibold uppercase">Confidence</span>
            <span className="text-sm font-extrabold text-accent font-mono mt-0.5 block">{confidence}</span>
          </div>
        </div>
      </div>

      {/* Expand/Collapse triggers */}
      <div className="pt-4 flex flex-col gap-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-bold text-text-secondary hover:text-text-primary flex items-center gap-1.5 cursor-pointer mx-auto transition-colors"
        >
          {expanded ? (
            <>
              Hide Technical Boundaries <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              View Technical Boundaries & AI Reasons <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-4 pt-1 border-t border-border/20"
            >
              {/* Boundaries grid */}
              <div className="grid grid-cols-4 gap-2 bg-secondary/10 p-3.5 rounded-xl border border-border/30 text-xs">
                <div>
                  <span className="text-[9px] text-text-secondary block font-bold uppercase">Entry Range</span>
                  <span className="font-mono font-bold text-text-primary mt-0.5 block">{entry}</span>
                </div>
                <div>
                  <span className="text-[9px] text-text-secondary block font-bold uppercase">Exit Target</span>
                  <span className="font-mono font-bold text-success mt-0.5 block">{target}</span>
                </div>
                <div>
                  <span className="text-[9px] text-text-secondary block font-bold uppercase">Stop Loss</span>
                  <span className="font-mono font-bold text-danger mt-0.5 block">{stopLoss}</span>
                </div>
                <div>
                  <span className="text-[9px] text-text-secondary block font-bold uppercase flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3 text-accent" /> R:R
                  </span>
                  <span className="font-mono font-bold text-text-primary mt-0.5 block">{riskReward}</span>
                </div>
              </div>

              {/* Rationale Checklist */}
              <div className="space-y-2">
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">
                  Why Quantara Likes This Trade:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-primary/90 font-semibold">
                  {reasons.map((reason, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <span>{reason}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 mt-1.5">
          <Link href="/analyze" className="w-full">
            <Button variant="ai" className="w-full flex items-center justify-center gap-1.5">
              Analyze Setup <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
export default TradeOfTheDay;
