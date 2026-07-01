"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowRight, Trash2, TrendingUp, TrendingDown, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WatchlistItem {
  ticker: string;
  name: string;
  price: string;
  change: string;
  up: boolean;
}

export interface WatchlistPanelProps {
  items: WatchlistItem[];
  onRemove: (ticker: string) => void;
  onSelect: (ticker: string) => void;
}

export function WatchlistPanel({ items, onRemove, onSelect }: WatchlistPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="p-6 rounded-[20px] bg-card border border-border glass shadow-soft hover:border-accent/30 transition-colors duration-300 relative"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <span className="font-caption text-[10px] text-text-secondary uppercase tracking-wider block">Monitor List</span>
              <h4 className="font-bold text-sm text-text-primary">Quick Watchlist</h4>
            </div>
          </div>
          <span className="text-[10px] font-bold font-mono text-text-secondary bg-secondary/50 px-2 py-0.5 rounded-full">
            {items.length} Tracked
          </span>
        </div>

        {/* List of Items */}
        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {items.length > 0 ? (
              items.map((item) => (
                <motion.div
                  key={item.ticker}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="p-3 rounded-xl bg-secondary/20 border border-border/30 hover:border-accent/20 flex justify-between items-center group/item hover:bg-secondary/40 transition-colors cursor-pointer"
                  onClick={() => onSelect(item.ticker)}
                >
                  {/* Symbol Details */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center font-bold text-[10px] text-text-secondary group-hover/item:text-accent group-hover/item:bg-accent/10 transition-colors">
                      {item.ticker.substring(0, 3)}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-text-primary block leading-none">{item.ticker}</span>
                      <span className="text-[9px] text-text-secondary truncate block max-w-[100px] mt-0.5">
                        {item.name}
                      </span>
                    </div>
                  </div>

                  {/* Pricing / Actions */}
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-text-primary block leading-none">{item.price}</span>
                      <span className={cn("text-[9px] font-semibold flex items-center justify-end gap-0.5 mt-1",
                        item.up ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {item.up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {item.change}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => onRemove(item.ticker)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover/item:opacity-100 transition-all cursor-pointer"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center text-xs text-text-secondary/70 flex flex-col items-center justify-center gap-2 border border-dashed border-border/60 rounded-xl bg-secondary/5"
              >
                <EyeOff className="w-6 h-6 text-text-secondary/40" />
                <span>Your watchlist is empty.</span>
                <span className="text-[9px]">Click the star on stock cards to monitor here.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Link */}
        {items.length > 0 && (
          <a
            href="/portfolio"
            className="w-full py-1.5 mt-1 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/40 hover:border-border text-center text-[10px] font-semibold text-text-secondary hover:text-text-primary flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            Go to Portfolio <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default WatchlistPanel;
