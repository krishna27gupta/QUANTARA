"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExplanationCardProps {
  title: string;
  explanation: string;
  sourceDocs?: string[];
  className?: string;
}

export function ExplanationCard({
  title,
  explanation,
  sourceDocs = [],
  className,
}: ExplanationCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "var(--shadow-soft)" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "p-6 rounded-[20px] bg-card border border-border space-y-4 hover:border-accent/40 glass",
        className
      )}
    >
      <div className="flex items-center gap-2 text-accent">
        <Sparkles className="w-5 h-5 text-accent animate-pulse" />
        <h4 className="font-bold text-sm text-text-primary">{title}</h4>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed font-body">
        {explanation}
      </p>

      {sourceDocs.length > 0 && (
        <div className="border-t border-border/40 pt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-text-secondary flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> References:
          </span>
          {sourceDocs.map((doc, idx) => (
            <span
              key={idx}
              className="text-[9px] px-2 py-0.5 rounded-md bg-secondary/60 text-text-secondary font-mono border border-border/40"
            >
              {doc}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
export default ExplanationCard;
