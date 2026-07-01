"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GitCompare, Sparkles, TrendingUp, ShieldAlert, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompareItem {
  ticker: string;
  name: string;
  price: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  profitProbability: number;
  expectedReturn: string;
  risk: "Low" | "Medium" | "High";
  recommendation: string;
}

export interface StockComparisonProps {
  niftyStocks: CompareItem[];
  defaultTickerA?: string;
  defaultTickerB?: string;
}

export function StockComparison({ niftyStocks, defaultTickerA = "RELIANCE", defaultTickerB = "TCS" }: StockComparisonProps) {
  const [tickerA, setTickerA] = useState(defaultTickerA);
  const [tickerB, setTickerB] = useState(defaultTickerB);
  
  const stockA = niftyStocks.find((s) => s.ticker === tickerA) || niftyStocks[0];
  const stockB = niftyStocks.find((s) => s.ticker === tickerB) || niftyStocks[1];

  const getSignalBadge = (signal: "BUY" | "SELL" | "HOLD") => {
    const styles = {
      BUY: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      SELL: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      HOLD: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    };
    return (
      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", styles[signal])}>
        {signal}
      </span>
    );
  };

  const getCompareRecommendation = () => {
    // Return comparison decision
    if (!stockA || !stockB) return "";
    
    if (stockA.signal === "BUY" && stockB.signal !== "BUY") {
      return `Quantara recommends favoring ${stockA.ticker} over ${stockB.ticker} due to a stronger entry signal.`;
    }
    if (stockB.signal === "BUY" && stockA.signal !== "BUY") {
      return `Quantara recommends favoring ${stockB.ticker} over ${stockA.ticker} due to a stronger entry signal.`;
    }

    const scoreA = stockA.confidence + stockB.profitProbability;
    const scoreB = stockB.confidence + stockA.profitProbability;

    if (scoreA > scoreB) {
      return `Quantara favors ${stockA.ticker} over ${stockB.ticker} based on a higher statistical probability score (${stockA.confidence}% confidence).`;
    }
    return `Quantara favors ${stockB.ticker} over ${stockA.ticker} based on a higher statistical probability score (${stockB.confidence}% confidence).`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="p-6 rounded-[24px] border border-border bg-card glass shadow-soft hover:border-accent/30 transition-colors duration-300 relative"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none" />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <div className="p-2 rounded-xl bg-accent/15 text-accent border border-accent/25">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <span className="font-caption text-[10px] text-text-secondary uppercase tracking-wider block">Comparison Engine</span>
            <h3 className="font-bold text-sm text-text-primary">Compare Core Opportunities</h3>
          </div>
        </div>

        {/* Dropdown selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Asset A</label>
            <select
              value={tickerA}
              onChange={(e) => setTickerA(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-border bg-secondary/40 text-text-primary outline-none focus:border-accent"
            >
              {niftyStocks.map((s) => (
                <option key={s.ticker} value={s.ticker}>
                  {s.ticker} - {s.name.substring(0, 15)}...
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Asset B</label>
            <select
              value={tickerB}
              onChange={(e) => setTickerB(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-border bg-secondary/40 text-text-primary outline-none focus:border-accent"
            >
              {niftyStocks.map((s) => (
                <option key={s.ticker} value={s.ticker}>
                  {s.ticker} - {s.name.substring(0, 15)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Matrix Table */}
        {stockA && stockB && (
          <div className="border border-border/40 rounded-xl overflow-hidden bg-secondary/10">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/20 font-semibold text-text-secondary">
                  <th className="p-3">Metric</th>
                  <th className="p-3 font-mono font-bold text-text-primary">{stockA.ticker}</th>
                  <th className="p-3 font-mono font-bold text-text-primary">{stockB.ticker}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-[11px]">
                <tr>
                  <td className="p-3 text-text-secondary font-medium">Daily Close</td>
                  <td className="p-3 font-mono font-semibold text-text-primary">{stockA.price}</td>
                  <td className="p-3 font-mono font-semibold text-text-primary">{stockB.price}</td>
                </tr>
                <tr>
                  <td className="p-3 text-text-secondary font-medium">AI Trade Signal</td>
                  <td className="p-3">{getSignalBadge(stockA.signal)}</td>
                  <td className="p-3">{getSignalBadge(stockB.signal)}</td>
                </tr>
                <tr>
                  <td className="p-3 text-text-secondary font-medium">AI Confidence</td>
                  <td className="p-3 font-mono font-semibold text-text-primary">{stockA.confidence}%</td>
                  <td className="p-3 font-mono font-semibold text-text-primary">{stockB.confidence}%</td>
                </tr>
                <tr>
                  <td className="p-3 text-text-secondary font-medium">Profit Prob.</td>
                  <td className="p-3 font-mono font-semibold text-text-primary">{stockA.profitProbability}%</td>
                  <td className="p-3 font-mono font-semibold text-text-primary">{stockB.profitProbability}%</td>
                </tr>
                <tr>
                  <td className="p-3 text-text-secondary font-medium">Exp. Return</td>
                  <td className={cn("p-3 font-mono font-semibold", !stockA.expectedReturn.startsWith("-") ? "text-emerald-500" : "text-rose-500")}>
                    {stockA.expectedReturn}
                  </td>
                  <td className={cn("p-3 font-mono font-semibold", !stockB.expectedReturn.startsWith("-") ? "text-emerald-500" : "text-rose-500")}>
                    {stockB.expectedReturn}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 text-text-secondary font-medium">Risk profile</td>
                  <td className="p-3">
                    <span className={cn("font-bold text-[10px]", 
                      stockA.risk === "Low" ? "text-emerald-500" : stockA.risk === "Medium" ? "text-amber-500" : "text-rose-500"
                    )}>
                      {stockA.risk}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={cn("font-bold text-[10px]", 
                      stockB.risk === "Low" ? "text-emerald-500" : stockB.risk === "Medium" ? "text-amber-500" : "text-rose-500"
                    )}>
                      {stockB.risk}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* AI Smart Recommendation Callout */}
        <div className="flex gap-2.5 items-start bg-accent/5 border border-accent/15 rounded-xl p-3 text-[10px] text-text-secondary">
          <Sparkles className="w-4 h-4 text-accent mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <span className="text-text-primary font-semibold">AI Comparison recommendation:</span> {getCompareRecommendation()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default StockComparison;
