"use client";

import React from "react";
import { ShieldCheck, Info, RefreshCcw } from "lucide-react";

export function TrustPanel() {
  return (
    <div className="p-4 rounded-[20px] bg-secondary/10 border border-border/40 space-y-2.5 text-[10px]">
      <div className="flex items-center justify-between text-text-secondary">
        <span className="font-semibold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Data Freshness
        </span>
        <span className="font-mono text-[9px] flex items-center gap-1">
          <RefreshCcw className="w-2.5 h-2.5 animate-spin-slow text-accent" /> Live NSE Ticks (2m ago)
        </span>
      </div>

      <p className="text-text-secondary/70 leading-relaxed pl-4 relative font-body text-[9px]">
        <Info className="w-3 h-3 absolute left-0 top-0.5 text-text-secondary/50" />
        <span className="text-text-primary/90 font-semibold block mb-0.5">Risk Warning:</span> 
        Quantara does not guarantee trading returns. All suggestions are generated mathematically by AI pattern matching. Swing trading carries significant risk of capital loss. Past results do not guarantee future gains.
      </p>
    </div>
  );
}

export default TrustPanel;
