"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function SkeletonFeed({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-pulse", className)}>
      {/* Hero card skeleton */}
      <div className="h-44 w-full bg-secondary/25 border border-border/40 rounded-[20px] p-6 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="h-3 w-32 bg-secondary/60 rounded-md" />
          <div className="h-6 w-64 bg-secondary/80 rounded-lg" />
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-20 bg-secondary/50 rounded-md" />
          <div className="h-4 w-24 bg-secondary/50 rounded-md" />
        </div>
      </div>

      {/* Main split: trade of the day and side card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-secondary/25 border border-border/40 rounded-[20px] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-secondary/60 rounded-lg" />
            <div className="h-6 w-16 bg-secondary/60 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-7 w-40 bg-secondary/80 rounded-lg" />
            <div className="h-3 w-56 bg-secondary/50 rounded-md" />
          </div>
          <div className="h-10 w-full bg-secondary/60 rounded-xl" />
        </div>

        {/* Side card skeleton */}
        <div className="h-64 bg-secondary/25 border border-border/40 rounded-[20px] p-6 flex flex-col justify-between">
          <div className="h-4 w-20 bg-secondary/60 rounded-lg" />
          <div className="space-y-3">
            <div className="h-3 w-full bg-secondary/60 rounded-md" />
            <div className="h-3 w-full bg-secondary/60 rounded-md" />
            <div className="h-3 w-2/3 bg-secondary/60 rounded-md" />
          </div>
          <div className="h-8 w-full bg-secondary/50 rounded-xl" />
        </div>
      </div>

      {/* Bottom pick grid skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="h-32 bg-secondary/20 border border-border/40 rounded-[20px] p-5 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-secondary/60 rounded-md" />
              <div className="h-4 w-10 bg-secondary/60 rounded-md" />
            </div>
            <div className="h-3.5 w-full bg-secondary/40 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
export default SkeletonFeed;
