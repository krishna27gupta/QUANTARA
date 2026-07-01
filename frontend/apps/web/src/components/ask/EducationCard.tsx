"use client";

import React from "react";
import { BookOpen, AlertCircle, CheckSquare } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface EducationCardProps {
  topicName: string;
  definition: string;
  gaugeValue?: number; // e.g. 72 for RSI
  gaugeLabel?: string; // e.g. "Overbought"
  learningSteps: string[];
}

export function EducationCard({
  topicName,
  definition,
  gaugeValue,
  gaugeLabel,
  learningSteps,
}: EducationCardProps) {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card/60 glass shadow-sm space-y-4 max-w-full overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <span className="font-caption text-[9px] text-text-secondary uppercase tracking-wider block">Education Module</span>
          <h4 className="font-bold text-xs text-text-primary">Quantara School: {topicName}</h4>
        </div>
      </div>

      {/* Main explanation text */}
      <p className="text-[11px] text-text-primary/95 leading-relaxed font-body">
        {definition}
      </p>

      {/* Visual Example Placeholder (Progressive Gauge) */}
      {gaugeValue !== undefined && (
        <div className="p-3 bg-secondary/20 border border-border/40 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-[10px] text-text-secondary">
            <span className="font-semibold">{topicName} Visual Indicator Example</span>
            <span className={cn("font-bold px-1.5 py-0.5 rounded text-[9px]", 
              gaugeValue >= 70 ? "bg-amber-500/10 text-amber-500" :
              gaugeValue <= 30 ? "bg-rose-500/10 text-rose-500" :
              "bg-emerald-500/10 text-emerald-500"
            )}>
              {gaugeLabel} ({gaugeValue})
            </span>
          </div>

          {/* Horizontal Indicator Gauge */}
          <div className="relative pt-1">
            <div className="flex h-2 overflow-hidden text-xs bg-border rounded-full">
              {/* Oversold zone */}
              <div style={{ width: "30%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-rose-500/30 border-r border-border/20" />
              {/* Neutral zone */}
              <div style={{ width: "40%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500/20 border-r border-border/20" />
              {/* Overbought zone */}
              <div style={{ width: "30%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-500/30" />
            </div>

            {/* Float marker indicating gaugeValue */}
            <motion.div
              initial={{ left: 0 }}
              animate={{ left: `${gaugeValue}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute top-0 h-4 w-1.5 bg-accent rounded-full border border-white -translate-y-1"
            />
          </div>

          <div className="flex justify-between text-[8px] text-text-secondary/70 font-mono">
            <span>0 (Oversold Area &lt; 30)</span>
            <span>50</span>
            <span>100 (Overbought Area &gt; 70)</span>
          </div>
        </div>
      )}

      {/* Progressive learning checklist */}
      <div className="space-y-2 pt-2 border-t border-border/30">
        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block flex items-center gap-1">
          <CheckSquare className="w-3.5 h-3.5 text-accent" /> Recommended Study Steps
        </span>
        <div className="space-y-1.5 pl-0.5">
          {learningSteps.map((step, idx) => (
            <div key={idx} className="flex gap-2 items-center text-[10px] text-text-secondary">
              <input 
                type="checkbox" 
                defaultChecked={idx === 0} 
                className="w-3 h-3 rounded border-border text-accent focus:ring-accent"
              />
              <span className={cn(idx === 0 && "text-text-primary font-semibold")}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EducationCard;
