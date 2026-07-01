"use client";

import React from "react";
import { Cpu, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIStatusPanel() {
  const engines = [
    { name: "Portfolio Analysis", status: "ONLINE", speed: "14ms" },
    { name: "Prediction Engine", status: "ONLINE", speed: "22ms" },
    { name: "Sentiment Analyzer", status: "ONLINE", speed: "8ms" },
    { name: "Risk Assessment", status: "ONLINE", speed: "12ms" },
    { name: "Recs Scanner", status: "ONLINE", speed: "18ms" },
    { name: "Memory Controller", status: "ONLINE", speed: "5ms" }
  ];

  return (
    <div className="p-5 rounded-[20px] bg-card border border-border glass shadow-soft hover:border-accent/20 transition-all space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
          <Cpu className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <span className="font-caption text-[9px] text-text-secondary uppercase tracking-wider block font-bold">Node Monitor</span>
          <h4 className="font-bold text-xs text-text-primary">AI Tool Pipeline Status</h4>
        </div>
      </div>

      {/* Grid of engines */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        {engines.map((eng) => (
          <div key={eng.name} className="p-2 bg-secondary/20 border border-border/40 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-text-primary block font-medium leading-none">{eng.name}</span>
              <span className="text-[8px] text-text-secondary mt-1 block font-mono">latency: {eng.speed}</span>
            </div>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AIStatusPanel;
