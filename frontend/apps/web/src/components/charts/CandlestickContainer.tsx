"use client";

import React from "react";
import { LineChart, RefreshCw, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function CandlestickContainer({
  title,
  subtitle = "NIFTY 50 price movement metrics",
  loading = false,
  className,
  children,
}: ChartContainerProps) {
  return (
    <div className={cn("p-6 rounded-[20px] bg-card border border-border space-y-4 hover:border-accent/30 glass", className)}>
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
            <LineChart className="w-4 h-4 text-accent" />
            {title}
          </h4>
          <span className="text-xs text-text-secondary">{subtitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg hover:bg-secondary/40 text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative h-60 w-full flex items-center justify-center bg-secondary/15 rounded-xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        ) : children ? (
          children
        ) : (
          <div className="text-center space-y-2">
            <BarChart2 className="w-8 h-8 text-text-secondary/50 mx-auto" />
            <span className="text-xs text-text-secondary block">No historical candlestick data loaded</span>
          </div>
        )}
      </div>
    </div>
  );
}
export default CandlestickContainer;
