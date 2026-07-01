"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, Check, Copy, ExternalLink, ShieldCheck, Newspaper } from "lucide-react";

export function AISummary() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = "Today's market remains moderately bullish. Banking and IT sectors show the strongest momentum while FMCG remains weak. The Fear & Greed index is at 67 (Greed), backed by strong institutional inflows, but volatility (VIX) remains low, offering sweet entries for swing traders.";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const citations = [
    { id: 1, name: "NSE Volume Scanner", type: "log" },
    { id: 2, name: "NIFTY F&O Open Interest", type: "csv" },
    { id: 3, name: "RSI Momentum Index", type: "indicator" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="p-6 rounded-[20px] bg-card border border-border glass shadow-soft hover:border-accent/30 transition-colors duration-300 relative overflow-hidden"
    >
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />

      <div className="space-y-4">
        {/* Title / AI Brand */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-purple-600 text-white shadow-sm">
              <Sparkles className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <span className="font-caption text-[10px] text-text-secondary uppercase tracking-wider block">Real-time Intelligence</span>
              <h4 className="font-bold text-sm text-text-primary flex items-center gap-1">
                AI Market Summary
              </h4>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg border border-border/40 hover:border-accent/40 bg-secondary/20 hover:bg-secondary/40 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Copy Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* AI Response Text */}
        <div className="font-body text-xs text-text-primary/90 leading-relaxed space-y-2.5">
          <p>
            Today&apos;s market remains <span className="text-emerald-500 font-semibold bg-emerald-500/5 px-1 py-0.5 rounded">moderately bullish</span>. 
            Banking <span className="font-mono text-[10px] text-text-secondary/70 bg-secondary/40 px-1 py-0.5 rounded">[1]</span> and IT <span className="font-mono text-[10px] text-text-secondary/70 bg-secondary/40 px-1 py-0.5 rounded">[2]</span> sectors show the strongest momentum 
            while FMCG remains weak. The Fear & Greed index is at 67 (Greed) <span className="font-mono text-[10px] text-text-secondary/70 bg-secondary/40 px-1 py-0.5 rounded">[3]</span>, backed by strong institutional inflows, but volatility (VIX) remains low, offering excellent entry points for swing traders.
          </p>
        </div>

        {/* Citations / Sources */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-[10px] text-text-secondary font-medium mr-1 flex items-center">Sources:</span>
          {citations.map((c) => (
            <div 
              key={c.id}
              className="flex items-center gap-1 bg-secondary/40 border border-border/40 hover:border-accent/40 rounded-lg px-2 py-0.5 text-[9px] text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <Newspaper className="w-2.5 h-2.5 text-accent/80" />
              <span>{c.name}</span>
              <span className="text-accent/60">[{c.id}]</span>
            </div>
          ))}
        </div>

        {/* Expandable Explanation Area */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border/40 pt-4 mt-2"
            >
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Grounded Insights
                </h5>
                <ul className="space-y-2 text-[11px] text-text-secondary leading-relaxed pl-1.5 list-disc list-inside">
                  <li>
                    <span className="text-text-primary font-semibold">Institutional Inflows:</span> FIIs have been net buyers for the last 3 trading sessions, concentrated in large-cap banking assets.
                  </li>
                  <li>
                    <span className="text-text-primary font-semibold">Derivative Data:</span> Call writing is dominant at 24,000 NIFTY strike, indicating strong immediate resistance, while 23,800 is acting as a major support floor.
                  </li>
                  <li>
                    <span className="text-text-primary font-semibold">Risk Warning:</span> Avoid heavy allocation in consumer durables and FMCG as they face overhead resistance on their daily moving averages.
                  </li>
                </ul>
                <div className="flex justify-between items-center text-[10px] pt-1.5 text-text-secondary">
                  <span>Last scanned: Today, 3:30 PM (NSE Close)</span>
                  <a href="/ask" className="text-accent hover:underline flex items-center gap-0.5">
                    Ask follow-up <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-1 border-t border-border/40 flex justify-center items-center gap-1 text-[10px] text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <span>{isExpanded ? "Collapse Analysis" : "Expand Full Analysis"}</span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-3 h-3" />
          </motion.div>
        </button>
      </div>
    </motion.div>
  );
}

export default AISummary;
