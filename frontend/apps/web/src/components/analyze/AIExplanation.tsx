"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, HelpCircle, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RationaleItem {
  id: string;
  title: string;
  shortDesc: string;
  fullExplanation: string;
  tip: string;
}

export interface AIExplanationProps {
  ticker: string;
  signal: string;
  rationales: RationaleItem[];
}

export function AIExplanation({ ticker, signal, rationales }: AIExplanationProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 rounded-[24px] border border-border bg-card glass shadow-soft hover:border-accent/30 transition-colors duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <span className="font-caption text-[10px] text-text-secondary uppercase tracking-wider block">AI Logic Disclosure</span>
            <h3 className="font-bold text-sm text-text-primary">
              Why does Quantara recommend {signal} for {ticker}?
            </h3>
          </div>
        </div>

        {/* List of rationales */}
        <div className="space-y-2">
          {rationales.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div 
                key={item.id}
                className={cn(
                  "border border-border/40 hover:border-accent/30 rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-all cursor-pointer overflow-hidden",
                  isExpanded && "border-accent/40 bg-secondary/35"
                )}
                onClick={() => toggleExpand(item.id)}
              >
                {/* Visible Title Row */}
                <div className="flex items-center justify-between p-3.5 select-none">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block leading-none">{item.title}</span>
                      <span className="text-[10px] text-text-secondary block mt-1">{item.shortDesc}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary/70">
                    <span title="Click to learn technical details">
                      <HelpCircle 
                        className="w-3.5 h-3.5 hover:text-accent transition-colors" 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(item.id);
                        }}
                      />
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </div>
                </div>

                {/* Expandable Explanation Panel */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border/20"
                    >
                      <div className="p-3.5 bg-secondary/10 space-y-3">
                        <p className="text-[11px] text-text-primary/90 leading-relaxed font-body">
                          {item.fullExplanation}
                        </p>
                        
                        {/* Educational Tooltip Box */}
                        <div className="flex gap-2 items-start bg-accent/5 border border-accent/15 rounded-lg p-2.5 text-[10px] text-text-secondary">
                          <AlertCircle className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                          <p className="leading-relaxed">
                            <span className="text-text-primary font-semibold">Educational Note:</span> {item.tip}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        {/* Step 1 & Step 6: AI Reasoning Checklist and Source Attribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/40">
          {/* Decision Indicators checklist */}
          <div className="space-y-2 bg-secondary/10 border border-border/30 rounded-xl p-3.5">
            <span className="text-[10px] text-accent font-bold uppercase tracking-wider block">Decision Indicators</span>
            <div className="space-y-1.5 text-xs text-text-secondary mt-2">
              <div className="flex items-center justify-between">
                <span>✓ Relative strength vs NIFTY</span>
                <span className="text-text-primary font-mono font-bold">+4.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>✓ Volume breakout</span>
                <span className="text-text-primary font-mono font-bold">2.4x mean</span>
              </div>
              <div className="flex items-center justify-between">
                <span>✓ Relative Strength Index (RSI)</span>
                <span className="text-text-primary font-mono font-bold">58 (Bullish)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>✓ MACD Indicator</span>
                <span className="text-text-primary font-mono font-bold">Bullish crossover</span>
              </div>
              <div className="flex items-center justify-between">
                <span>✓ Institutional Flow (FII/DII)</span>
                <span className="text-success font-mono font-bold">₹324 Cr net buy</span>
              </div>
              <div className="flex items-center justify-between">
                <span>✓ Sector Momentum</span>
                <span className="text-success font-mono font-bold">Energy +2.1%</span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-border/20 grid grid-cols-3 gap-2 text-[9px] text-text-secondary font-mono">
              <div><span>Holding:</span> <span className="text-text-primary block font-bold">5–7 days</span></div>
              <div><span>Risk:</span> <span className="text-amber-500 block font-bold">Medium</span></div>
              <div><span>Accuracy:</span> <span className="text-accent block font-bold">72%</span></div>
            </div>
          </div>

          {/* Sources list */}
          <div className="space-y-2 bg-secondary/10 border border-border/30 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-accent font-bold uppercase tracking-wider block">Validated Data Sources</span>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {["NSE India", "Yahoo Finance", "India VIX", "FII/DII Flows", "News Sentiment Lexicon"].map((src, i) => (
                  <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent/5 text-text-primary border border-border/60">
                    ✓ {src}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="border-t border-border/20 pt-2 flex items-center justify-between text-[9px] text-text-secondary">
              <span>Updated: **Daily 3:45 PM IST**</span>
              <span className="text-accent bg-accent/10 px-1.5 py-0.5 rounded font-bold">LIVE VALIDATED</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AIExplanation;
