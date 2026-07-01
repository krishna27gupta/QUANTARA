"use client";

import React from "react";
import { Smile, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SentimentContainerProps {
  title: string;
  gaugePercent: number;
  loading?: boolean;
  className?: string;
}

export function SentimentContainer({
  title,
  gaugePercent,
  loading = false,
  className,
}: SentimentContainerProps) {
  return (
    <div className={cn("p-6 rounded-[20px] bg-card border border-border space-y-4 glass", className)}>
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
          <Smile className="w-4 h-4 text-accent" />
          {title}
        </h4>
        <HelpCircle className="w-4 h-4 text-text-secondary cursor-pointer hover:text-text-primary" />
      </div>

      <div className="relative h-44 w-full flex items-center justify-center bg-secondary/15 rounded-xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="text-center space-y-3">
            {/* Draw a circular progress indicator */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="var(--color-border)" strokeWidth="8" fill="transparent" />
                <circle cx="48" cy="48" r="40" stroke="var(--color-accent)" strokeWidth="8" fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * gaugePercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-mono font-bold text-lg text-text-primary">{gaugePercent}%</span>
            </div>
            <span className="text-[10px] text-text-secondary block font-semibold uppercase">Overall Bullish Gauge</span>
          </div>
        )}
      </div>
    </div>
  );
}
export default SentimentContainer;
