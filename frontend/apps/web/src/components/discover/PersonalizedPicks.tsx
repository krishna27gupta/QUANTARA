"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, Shield, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

interface AllocationItem {
  ticker: string;
  percentage: number;
  color: string;
}

export function PersonalizedPicks() {
  // User Profile State
  const [capital, setCapital] = useState(50000);
  const [risk, setRisk] = useState<"Low" | "Medium" | "High">("Medium");
  const [holdingDays, setHoldingDays] = useState(7);

  // Computed Outputs
  const [allocation, setAllocation] = useState<AllocationItem[]>([]);
  const [expectedReturn, setExpectedReturn] = useState(5.4);
  const [expectedRisk, setExpectedRisk] = useState<"Low" | "Medium" | "High">("Medium");

  // Re-run allocation algorithm when inputs change
  useEffect(() => {
    // Simulated dynamic allocation logic
    let items: AllocationItem[] = [];
    let baseReturn = 0;

    if (risk === "Low") {
      items = [
        { ticker: "ITC", percentage: 40, color: "bg-emerald-500" },
        { ticker: "HDFCBANK", percentage: 35, color: "bg-blue-500" },
        { ticker: "ASIANPAINTS", percentage: 25, color: "bg-indigo-500" },
      ];
      // Expected return varies slightly based on holding period
      baseReturn = 3.2 + (holdingDays * 0.1);
    } else if (risk === "Medium") {
      items = [
        { ticker: "RELIANCE", percentage: 50, color: "bg-blue-500" },
        { ticker: "TCS", percentage: 30, color: "bg-indigo-500" },
        { ticker: "HDFCBANK", percentage: 20, color: "bg-emerald-500" },
      ];
      baseReturn = 4.6 + (holdingDays * 0.12);
    } else {
      items = [
        { ticker: "TRENT", percentage: 45, color: "bg-purple-500" },
        { ticker: "ADANI PORTS", percentage: 35, color: "bg-rose-500" },
        { ticker: "BAJAJ FINANCE", percentage: 20, color: "bg-amber-500" },
      ];
      baseReturn = 6.8 + (holdingDays * 0.25);
    }

    // Capital factor (larger sums slightly optimized for returns)
    const capitalBonus = Math.min((capital - 10000) / 490000 * 0.5, 0.5);
    
    setAllocation(items);
    setExpectedReturn(parseFloat((baseReturn + capitalBonus).toFixed(1)));
    setExpectedRisk(risk);
  }, [capital, risk, holdingDays]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="p-6 rounded-[20px] bg-card border border-border glass shadow-soft hover:border-accent/30 transition-colors duration-300 relative"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <span className="font-caption text-[10px] text-text-secondary uppercase tracking-wider block">Targeted Strategy</span>
            <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
              Personalized Allocator
              <span className="text-[10px] bg-accent/15 text-accent font-semibold px-1.5 py-0.5 rounded">AI Option</span>
            </h4>
          </div>
        </div>

        {/* Inputs Section */}
        <div className="space-y-4">
          {/* Capital Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary flex items-center gap-0.5"><IndianRupee className="w-3 h-3" /> Target Capital</span>
              <span className="font-bold text-text-primary font-mono">₹{capital.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="200000"
              step="5000"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          {/* Risk Level Toggles */}
          <div className="space-y-1.5">
            <span className="text-xs text-text-secondary flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Risk Tolerance
            </span>
            <div className="grid grid-cols-3 gap-2 bg-secondary/30 p-1 rounded-xl border border-border/40">
              {(["Low", "Medium", "High"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRisk(r)}
                  className={cn(
                    "py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                    risk === r
                      ? r === "Low"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : r === "Medium"
                        ? "bg-accent text-white shadow-sm"
                        : "bg-rose-500 text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-secondary/40"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Holding Period */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary">Expected Holding</span>
              <span className="font-bold text-text-primary font-mono">{holdingDays} Days</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={holdingDays}
              onChange={(e) => setHoldingDays(Number(e.target.value))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="pt-4 border-t border-border/40 space-y-4">
          <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-bold">Suggested Allocation</span>
          
          {/* Segmented Progress Bar */}
          <div className="w-full h-3.5 bg-border/40 rounded-full flex overflow-hidden border border-border/20">
            {allocation.map((item) => (
              <motion.div
                key={item.ticker}
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn("h-full", item.color, "relative group")}
                style={{ originX: 0 }}
              />
            ))}
          </div>

          {/* Legend Details */}
          <div className="grid grid-cols-3 gap-2">
            {allocation.map((item) => (
              <div key={item.ticker} className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", item.color)} />
                <div>
                  <span className="text-[10px] font-bold text-text-primary block leading-none">{item.ticker}</span>
                  <span className="text-[9px] text-text-secondary font-mono leading-none">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Allocation Performance Stats */}
          <div className="grid grid-cols-2 gap-3 bg-purple-500/5 border border-purple-500/10 rounded-xl p-3">
            <div>
              <span className="text-[10px] text-text-secondary block">Exp. Return</span>
              <span className="text-xs font-bold text-emerald-500 font-mono flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +{expectedReturn}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-secondary block">Strategy Risk</span>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border inline-block mt-0.5",
                expectedRisk === "Low" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                expectedRisk === "Medium" ? "bg-accent/10 text-accent border-accent/20" :
                "bg-rose-500/10 text-rose-500 border-rose-500/20"
              )}>
                {expectedRisk}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default PersonalizedPicks;
