"use client";

import React from "react";
import { TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PortfolioContainerProps {
  title: string;
  equityValue: string;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function PortfolioContainer({
  title,
  equityValue,
  loading = false,
  className,
  children,
}: PortfolioContainerProps) {
  return (
    <div className={cn("p-6 rounded-[20px] bg-card border border-border space-y-4 glass", className)}>
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-accent" />
            {title}
          </h4>
          <span className="text-[10px] text-text-secondary uppercase">Asset allocation metrics</span>
        </div>
        <span className="text-xl font-bold font-mono text-text-primary">{equityValue}</span>
      </div>

      <div className="relative h-56 w-full flex items-center justify-center bg-secondary/15 rounded-xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        ) : children ? (
          children
        ) : (
          <div className="text-center space-y-2">
            <Award className="w-8 h-8 text-text-secondary/40 mx-auto" />
            <span className="text-xs text-text-secondary">Portfolio asset allocation loaded empty</span>
          </div>
        )}
      </div>
    </div>
  );
}
export default PortfolioContainer;
