"use client";

import React from "react";
import { BarChart3, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VolumeContainerProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  className?: string;
}

export function VolumeContainer({
  title,
  subtitle = "Daily exchange execution metrics",
  loading = false,
  className,
}: VolumeContainerProps) {
  return (
    <div className={cn("p-6 rounded-[20px] bg-card border border-border space-y-4 glass", className)}>
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-accent" />
          {title}
        </h4>
        <span className="text-text-secondary cursor-pointer hover:text-text-primary">
          <Info className="w-4 h-4" />
        </span>
      </div>

      <div className="relative h-40 w-full flex items-center justify-center bg-secondary/15 rounded-xl border border-border/50">
        {loading ? (
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="w-full h-full px-6 flex items-end gap-1 pb-4">
            {/* Draw mock volume bars */}
            {[20, 45, 28, 80, 60, 35, 90, 75, 40, 55, 65, 85].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-secondary/80 rounded-t-sm group hover:bg-accent transition-colors"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        )}
      </div>
      <span className="text-[10px] text-text-secondary block text-center">
        {subtitle}
      </span>
    </div>
  );
}
export default VolumeContainer;
