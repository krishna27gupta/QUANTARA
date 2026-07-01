"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StockCardProps {
  ticker: string;
  name: string;
  price: string;
  change: string;
  up?: boolean;
  className?: string;
}

export function StockCard({
  ticker,
  name,
  price,
  change,
  up = true,
  className,
}: StockCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "var(--shadow-soft)" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "p-5 rounded-[20px] bg-card border border-border flex justify-between items-center w-full hover:border-accent/40 glass",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-[14px] bg-secondary/50 flex items-center justify-center font-bold text-sm text-accent">
          {ticker.substring(0, 2)}
        </div>
        <div>
          <h4 className="font-bold text-sm text-text-primary">{ticker}</h4>
          <span className="font-caption text-text-secondary">{name}</span>
        </div>
      </div>

      <div className="text-right space-y-1">
        <div className="font-mono font-bold text-sm text-text-primary">{price}</div>
        <div className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg", 
          up ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        )}>
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{change}</span>
        </div>
      </div>
    </motion.div>
  );
}
export default StockCard;
