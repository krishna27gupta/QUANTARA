"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap, TrendingUp, TrendingDown, Layers, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectorData {
  id: string;
  name: string;
  strength: number; // 0-100 scale of overall sector health
  momentum: number; // percent change e.g. +2.1 or -0.8
  sentiment: "Bullish" | "Neutral" | "Bearish";
  topStock: string;
  stocksCount: number;
}

export interface SectorHeatmapProps {
  onSectorSelect?: (sectorName: string | null) => void;
  selectedSector?: string | null;
}

const defaultSectors: SectorData[] = [
  { id: "banking", name: "Banking", strength: 88, momentum: 2.3, sentiment: "Bullish", topStock: "HDFCBANK", stocksCount: 12 },
  { id: "it", name: "IT", strength: 82, momentum: 1.6, sentiment: "Bullish", topStock: "TCS", stocksCount: 10 },
  { id: "energy", name: "Energy", strength: 74, momentum: 0.9, sentiment: "Bullish", topStock: "RELIANCE", stocksCount: 6 },
  { id: "auto", name: "Auto", strength: 52, momentum: -0.4, sentiment: "Neutral", topStock: "M&M", stocksCount: 8 },
  { id: "pharma", name: "Pharma", strength: 61, momentum: 0.2, sentiment: "Neutral", topStock: "SUNPHARMA", stocksCount: 7 },
  { id: "fmcg", name: "FMCG", strength: 38, momentum: -1.2, sentiment: "Bearish", topStock: "ITC", stocksCount: 5 },
  { id: "metals", name: "Metals", strength: 45, momentum: -0.8, sentiment: "Bearish", topStock: "TATASTEEL", stocksCount: 6 },
];

export function SectorHeatmap({ onSectorSelect, selectedSector = null }: SectorHeatmapProps) {
  const [sectors, setSectors] = useState<SectorData[]>(defaultSectors);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Determine heat coloring based on momentum
  const getHeatStyle = (momentum: number, isSelected: boolean) => {
    if (momentum >= 1.5) {
      return isSelected 
        ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30";
    }
    if (momentum >= 0) {
      return isSelected
        ? "bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(5,150,105,0.4)]"
        : "bg-emerald-600/10 text-emerald-300/90 border-emerald-600/20 hover:bg-emerald-600/20";
    }
    if (momentum >= -0.5) {
      return isSelected
        ? "bg-zinc-600 text-white border-zinc-500 shadow-[0_0_15px_rgba(113,113,122,0.4)]"
        : "bg-secondary/40 text-text-secondary border-border hover:bg-secondary/60";
    }
    return isSelected
      ? "bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
      : "bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30";
  };

  const handleBlockClick = (name: string) => {
    if (onSectorSelect) {
      if (selectedSector === name) {
        onSectorSelect(null); // toggle off
      } else {
        onSectorSelect(name);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="p-6 rounded-[20px] bg-card border border-border glass shadow-soft relative overflow-hidden flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <span className="font-caption text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Heatmap Overview
            </span>
            <h3 className="text-xl font-bold mt-1 text-text-primary">Sector Strength</h3>
          </div>
          {selectedSector && (
            <button
              onClick={() => onSectorSelect && onSectorSelect(null)}
              className="text-[10px] font-semibold text-accent hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Heat Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-4">
          {sectors.map((sector) => {
            const isSelected = selectedSector === sector.name;
            const heatStyle = getHeatStyle(sector.momentum, isSelected);
            const isPositive = sector.momentum >= 0;

            return (
              <motion.div
                key={sector.id}
                whileHover={{ scale: 1.03 }}
                onClick={() => handleBlockClick(sector.name)}
                onMouseEnter={() => setHoveredId(sector.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  "p-4 rounded-xl border flex flex-col justify-between h-32 cursor-pointer transition-all duration-300",
                  heatStyle
                )}
              >
                <div>
                  <span className="font-bold text-xs truncate block">{sector.name}</span>
                  <span className={cn(
                    "text-[9px] font-semibold", 
                    isSelected ? "text-white/80" : "text-text-secondary/80"
                  )}>
                    {sector.stocksCount} Stocks
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-sm">
                      {isPositive ? "+" : ""}
                      {sector.momentum}%
                    </span>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="w-3 h-3 flex-shrink-0" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[8px] tracking-wider uppercase block mt-0.5 font-bold",
                    isSelected ? "text-white/90" : 
                    sector.sentiment === "Bullish" ? "text-emerald-400" :
                    sector.sentiment === "Bearish" ? "text-rose-400" : "text-amber-500"
                  )}>
                    {sector.sentiment}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Detail Panel for hovered or first selected sector */}
        <div className="mt-4 p-3 bg-secondary/20 border border-border/30 rounded-xl flex items-center justify-between text-xs">
          {hoveredId || selectedSector ? (
            (() => {
              const activeSec = sectors.find(s => s.id === hoveredId || s.name === selectedSector);
              if (!activeSec) return null;
              return (
                <>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-accent" />
                    <span className="text-text-primary font-bold">{activeSec.name} Sector</span>
                    <span className="text-text-secondary">|</span>
                    <span className="text-text-secondary">Top Pick: <span className="text-accent font-semibold">{activeSec.topStock}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">Score:</span>
                    <span className={cn("font-bold px-1.5 py-0.5 rounded text-[10px]",
                      activeSec.strength >= 75 ? "bg-emerald-500/10 text-emerald-500" :
                      activeSec.strength >= 50 ? "bg-amber-500/10 text-amber-500" :
                      "bg-rose-500/10 text-rose-500"
                    )}>
                      {activeSec.strength}/100
                    </span>
                  </div>
                </>
              );
            })()
          ) : (
            <span className="text-text-secondary flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-text-secondary/70" />
              Hover or click blocks to filter or view top sector momentum stocks.
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default SectorHeatmap;
