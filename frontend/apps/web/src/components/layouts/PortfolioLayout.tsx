"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface PortfolioLayoutProps {
  summaryCards: React.ReactNode;
  holdingsTable: React.ReactNode;
  chartsSection?: React.ReactNode;
  className?: string;
}

export function PortfolioLayout({
  summaryCards,
  holdingsTable,
  chartsSection,
  className,
}: PortfolioLayoutProps) {
  return (
    <div className={cn("space-y-6 w-full", className)}>
      {/* Top Asset Balance cards */}
      <div className="w-full">{summaryCards}</div>

      {/* Main Grid: holdings table and chart splits */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 w-full">{holdingsTable}</div>
        {chartsSection && <div className="w-full">{chartsSection}</div>}
      </div>
    </div>
  );
}
export default PortfolioLayout;
