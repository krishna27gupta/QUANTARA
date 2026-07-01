"use client";

import React from "react";
import { motion } from "framer-motion";
import { Layers, ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimilarStock {
  ticker: string;
  name: string;
  price: string;
  change: string;
  similarity: number; // e.g. 94
  signal: "BUY" | "SELL" | "HOLD";
}

export interface SimilarOpportunitiesProps {
  currentTicker: string;
  similarStocks: SimilarStock[];
  onSelect: (ticker: string) => void;
}

export function SimilarOpportunities({
  currentTicker,
  similarStocks,
  onSelect,
}: SimilarOpportunitiesProps) {
  const signalStyles = {
    BUY: "text-emerald-500 bg-emerald-500/10",
    SELL: "text-rose-500 bg-rose-500/10",
    HOLD: "text-amber-500 bg-amber-500/10",
  };

  return (
    <motion.div
      whileHover={{ y: -4, borderColor: "rgba(59, 130, 246, 0.4)", boxShadow: "var(--shadow-soft-val)" }}
      transition={{ duration: 0.2 }}
      className="p-6 rounded-[20px] bg-card border border-border space-y-4 hover:border-accent/40 glass shadow-soft relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-accent" /> Similar Opportunities
        </h4>
        <span className="text-[10px] text-text-secondary flex items-center gap-1 font-semibold">
          <Sparkles className="w-3 h-3 text-accent" /> Pattern Match
        </span>
      </div>

      {/* Grid of similar opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {similarStocks.map((item) => (
          <div
            key={item.ticker}
            onClick={() => onSelect(item.ticker)}
            className="p-3.5 rounded-xl bg-secondary/20 border border-border/40 hover:border-accent/30 hover:bg-secondary/35 cursor-pointer group flex justify-between items-center transition-all duration-300 select-none"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-text-primary">{item.ticker}</span>
                <span className={cn("text-[8px] font-bold px-1 rounded-md", signalStyles[item.signal])}>
                  {item.signal}
                </span>
              </div>
              <span className="text-[9px] text-text-secondary block truncate max-w-[100px] leading-none">
                {item.name}
              </span>
              <div className="flex items-center gap-1 text-[9px] font-medium text-text-secondary/70">
                <span>Match:</span>
                <span className="text-accent font-bold font-mono">{item.similarity}%</span>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono font-bold text-xs text-text-primary block leading-none">{item.price}</span>
              <span className={cn("text-[9px] font-semibold block mt-1", 
                item.change.startsWith("-") ? "text-rose-500" : "text-emerald-500"
              )}>
                {item.change}
              </span>
              <span className="text-[9px] text-text-secondary opacity-0 group-hover:opacity-100 group-hover:text-accent transition-all inline-flex items-center gap-0.5 mt-1.5">
                Analyze <ArrowUpRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default SimilarOpportunities;
