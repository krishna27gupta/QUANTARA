"use client";

import React from "react";
import { Activity, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PerformanceContainerProps {
  title: string;
  metric: string;
  loading?: boolean;
  className?: string;
}

export function PerformanceContainer({
  title,
  metric,
  loading = false,
  className,
}: PerformanceContainerProps) {
  return (
    <div className={cn("p-6 rounded-[20px] bg-card border border-border space-y-4 glass", className)}>
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-accent" />
          {title}
        </h4>
        <span className="text-xs font-semibold text-success flex items-center gap-0.5">
          {metric} <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>

      <div className="relative h-44 w-full flex items-center justify-center bg-secondary/15 rounded-xl border border-border/50">
        {loading ? (
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="w-full h-full p-4 flex flex-col justify-around">
            {/* Draw mock performance indicators */}
            {[
              { label: "Predictive Win Index", val: 82 },
              { label: "Sharpe Ratio", val: 68 },
              { label: "Alpha Coefficient", val: 54 },
            ].map((perf, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-text-secondary">
                  <span>{perf.label}</span>
                  <span className="font-mono">{perf.val}%</span>
                </div>
                <div className="w-full h-1.5 bg-secondary/40 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${perf.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default PerformanceContainer;
