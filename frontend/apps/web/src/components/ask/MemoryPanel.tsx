"use client";

import React, { useState } from "react";
import { Brain, Star, Check, Sliders, IndianRupee, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface MemoryData {
  riskTolerance: "Low" | "Medium" | "High";
  capital: number;
  holdingPeriod: number; // days
  preferredSectors: string[];
  tradingStyle: "Swing" | "Day" | "Position";
}

export interface MemoryPanelProps {
  memory: MemoryData;
  onUpdateMemory: (updated: MemoryData) => void;
}

export function MemoryPanel({ memory, onUpdateMemory }: MemoryPanelProps) {
  const [risk, setRisk] = useState(memory.riskTolerance);
  const [cap, setCap] = useState(memory.capital);
  const [holding, setHolding] = useState(memory.holdingPeriod);
  const [style, setStyle] = useState(memory.tradingStyle);
  const [isSaved, setIsSaved] = useState(false);

  const availableSectors = ["Banking", "IT", "Energy", "Pharma", "Auto", "FMCG", "Metals"];
  const [sectors, setSectors] = useState<string[]>(memory.preferredSectors);

  const toggleSector = (sec: string) => {
    let updated;
    if (sectors.includes(sec)) {
      updated = sectors.filter((s) => s !== sec);
    } else {
      updated = [...sectors, sec];
    }
    setSectors(updated);
    triggerSave({ preferredSectors: updated });
  };

  const triggerSave = (partial: Partial<MemoryData>) => {
    const updated = {
      riskTolerance: risk,
      capital: cap,
      holdingPeriod: holding,
      preferredSectors: sectors,
      tradingStyle: style,
      ...partial,
    };
    onUpdateMemory(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  return (
    <div className="p-5 rounded-[20px] bg-card border border-border glass shadow-soft hover:border-accent/20 transition-all space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/25">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <span className="font-caption text-[9px] text-text-secondary uppercase tracking-wider block">Contextual Recall</span>
            <h4 className="font-bold text-xs text-text-primary">Quantara Memory</h4>
          </div>
        </div>
        <AnimatePresence>
          {isSaved && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5"
            >
              <Check className="w-3 h-3" /> Auto-Saved
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Settings inputs list */}
      <div className="space-y-4 text-xs">
        {/* Risk Tolerance Toggle */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-text-secondary font-semibold uppercase flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Risk Tolerance
          </label>
          <div className="grid grid-cols-3 gap-1 bg-secondary/30 p-1 rounded-xl border border-border/30">
            {(["Low", "Medium", "High"] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRisk(r);
                  triggerSave({ riskTolerance: r });
                }}
                className={cn(
                  "py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer",
                  risk === r ? "bg-accent text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Capital Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-text-secondary font-semibold uppercase flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5" /> Capital Limit
            </span>
            <span className="font-mono font-bold text-text-primary">₹{cap.toLocaleString("en-IN")}</span>
          </div>
          <input
            type="range"
            min="10000"
            max="150000"
            step="5000"
            value={cap}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCap(val);
              triggerSave({ capital: val });
            }}
            className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
          />
        </div>

        {/* Holding Period Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-text-secondary font-semibold uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Holding Days
            </span>
            <span className="font-mono font-bold text-text-primary">{holding} Days</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={holding}
            onChange={(e) => {
              const val = Number(e.target.value);
              setHolding(val);
              triggerSave({ holdingPeriod: val });
            }}
            className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
          />
        </div>

        {/* Sectors Checklist */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-text-secondary font-semibold uppercase block">
            Preferred Sectors
          </span>
          <div className="flex flex-wrap gap-1">
            {availableSectors.map((sec) => {
              const selected = sectors.includes(sec);
              return (
                <button
                  key={sec}
                  onClick={() => toggleSector(sec)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full border text-[9px] font-semibold transition-all cursor-pointer",
                    selected
                      ? "bg-accent/15 border-accent/40 text-accent"
                      : "bg-secondary/20 border-border/40 text-text-secondary hover:text-text-primary"
                  )}
                >
                  {sec}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoryPanel;
