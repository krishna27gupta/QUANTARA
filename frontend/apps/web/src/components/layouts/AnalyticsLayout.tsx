"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface AnalyticsLayoutProps {
  chartSection: React.ReactNode;
  controlsSection: React.ReactNode;
  detailsSection?: React.ReactNode;
  className?: string;
}

export function AnalyticsLayout({
  chartSection,
  controlsSection,
  detailsSection,
  className,
}: AnalyticsLayoutProps) {
  return (
    <div className={cn("flex flex-col lg:flex-row gap-6 w-full items-start", className)}>
      {/* Left Column: Visual Charts */}
      <div className="flex-1 w-full space-y-6">
        {chartSection}
        {detailsSection && <div className="w-full">{detailsSection}</div>}
      </div>

      {/* Right Column: Parameters and Indicators */}
      <div className="w-full lg:w-96 shrink-0 space-y-6">
        {controlsSection}
      </div>
    </div>
  );
}
export default AnalyticsLayout;
