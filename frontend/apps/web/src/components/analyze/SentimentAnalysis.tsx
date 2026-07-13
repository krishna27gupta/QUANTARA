"use client";

import React from "react";
import { motion } from "framer-motion";
import { Smile, MessageSquare, Landmark, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SentimentAnalysisProps {
  sentimentModel: string;
}

export function SentimentAnalysis({
  sentimentModel,
}: SentimentAnalysisProps) {
  return (
    <motion.div
      whileHover={{ y: -4, borderColor: "rgba(59, 130, 246, 0.4)", boxShadow: "var(--shadow-soft-val)" }}
      transition={{ duration: 0.2 }}
      className="p-6 rounded-[20px] bg-card border border-border space-y-5 hover:border-accent/40 glass shadow-soft relative flex flex-col justify-between"
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
          <Smile className="w-4 h-4 text-accent" /> Sentiment Pulse
        </h4>
        <span className="text-[9px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
          News & Context
        </span>
      </div>

      <div className="py-4 space-y-3 flex-grow flex flex-col items-center justify-center text-center">
        <Landmark className="w-8 h-8 text-border mb-2" />
        <span className="text-xs text-text-secondary">
          Fine-grained sentiment metrics are internally aggregated by the ensemble engine and are not currently exposed individually.
        </span>
      </div>

      {/* Engine Source */}
      <div className="pt-3 border-t border-border/40 space-y-2">
        <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block">Analysis Engine</span>
        <div className="bg-secondary/15 border border-border/30 rounded-xl p-3.5 flex items-center justify-between">
          <span className="text-[10px] text-text-primary font-bold">{sentimentModel}</span>
          <span className="text-[8px] text-text-secondary px-2 py-0.5 border border-border/40 rounded-full">ACTIVE</span>
        </div>
      </div>
    </motion.div>
  );
}

export default SentimentAnalysis;
