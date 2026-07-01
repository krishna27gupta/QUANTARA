"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShieldCheck, Zap, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PickItem {
  ticker: string;
  name: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: string;
  probability: string;
  expectedReturn: string;
}

export function CategorizedPicks() {
  const [activeTab, setActiveTab] = useState("top");

  const tabs = [
    { label: "Top Picks", value: "top", icon: Sparkles },
    { label: "Safe Picks (Low-Risk)", value: "safe", icon: ShieldCheck },
    { label: "Aggressive Picks (High-Risk)", value: "aggressive", icon: Zap },
    { label: "Personalized Picks", value: "personalized", icon: UserCheck },
  ];

  const pickGroups: Record<string, PickItem[]> = {
    top: [
      { ticker: "TCS", name: "Tata Consultancy Services Ltd.", signal: "BUY", confidence: "88%", probability: "74%", expectedReturn: "+5.2%" },
      { ticker: "RELIANCE", name: "Reliance Industries Ltd.", signal: "BUY", confidence: "92%", probability: "81%", expectedReturn: "+4.8%" },
      { ticker: "INFY", name: "Infosys Ltd.", signal: "HOLD", confidence: "74%", probability: "62%", expectedReturn: "+1.2%" },
    ],
    safe: [
      { ticker: "HDFCBANK", name: "HDFC Bank Ltd.", signal: "BUY", confidence: "94%", probability: "86%", expectedReturn: "+3.5%" },
      { ticker: "ITC", name: "ITC Ltd.", signal: "BUY", confidence: "90%", probability: "82%", expectedReturn: "+3.2%" },
      { ticker: "ICICIBANK", name: "ICICI Bank Ltd.", signal: "BUY", confidence: "86%", probability: "79%", expectedReturn: "+4.1%" },
    ],
    aggressive: [
      { ticker: "M&M", name: "Mahindra & Mahindra Ltd.", signal: "BUY", confidence: "84%", probability: "68%", expectedReturn: "+8.5%" },
      { ticker: "TATASTEEL", name: "Tata Steel Ltd.", signal: "SELL", confidence: "80%", probability: "70%", expectedReturn: "-6.2%" },
      { ticker: "ADANIENT", name: "Adani Enterprises Ltd.", signal: "BUY", confidence: "72%", probability: "58%", expectedReturn: "+12.4%" },
    ],
    personalized: [
      { ticker: "RELIANCE", name: "Reliance Industries Ltd.", signal: "BUY", confidence: "92%", probability: "81%", expectedReturn: "+4.8%" },
      { ticker: "HDFCBANK", name: "HDFC Bank Ltd.", signal: "BUY", confidence: "94%", probability: "86%", expectedReturn: "+3.5%" },
      { ticker: "TCS", name: "Tata Consultancy Services Ltd.", signal: "BUY", confidence: "88%", probability: "74%", expectedReturn: "+5.2%" },
    ],
  };

  const signalColors = {
    BUY: "text-success bg-success/10",
    SELL: "text-danger bg-danger/10",
    HOLD: "text-amber-500 bg-amber-500/10",
  };

  const activePicks = pickGroups[activeTab] || [];

  return (
    <div className="space-y-4">
      {/* Scrollable Selector row */}
      <div className="flex flex-wrap gap-2 pb-1 border-b border-border/40 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors border select-none",
                isActive 
                  ? "bg-accent/10 border-accent text-accent shadow-sm" 
                  : "bg-card border-border text-text-secondary hover:text-text-primary hover:bg-secondary/40"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatePresence mode="wait">
          {activePicks.map((pick, i) => (
            <motion.div
              key={`${activeTab}-${pick.ticker}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              whileHover={{ y: -4, boxShadow: "var(--shadow-soft)" }}
              className="p-5 rounded-[20px] bg-card border border-border flex flex-col justify-between hover:border-accent/40 glass"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-sm font-mono text-text-primary">{pick.ticker}</h4>
                  <span className="text-[10px] text-text-secondary truncate max-w-[120px] block">{pick.name}</span>
                </div>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg border border-border/20", signalColors[pick.signal])}>
                  {pick.signal}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-3 border-t border-border/40 text-center text-xs">
                <div>
                  <span className="text-[9px] text-text-secondary block font-bold">Return</span>
                  <span className="font-mono font-bold text-success mt-0.5 block">{pick.expectedReturn}</span>
                </div>
                <div>
                  <span className="text-[9px] text-text-secondary block font-bold">Prob.</span>
                  <span className="font-mono font-bold text-text-primary mt-0.5 block">{pick.probability}</span>
                </div>
                <div>
                  <span className="text-[9px] text-text-secondary block font-bold">Conf.</span>
                  <span className="font-mono font-bold text-accent mt-0.5 block">{pick.confidence}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
export default CategorizedPicks;
