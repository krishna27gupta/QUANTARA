"use client";

import React from "react";
import { HelpCircle, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function QuickAskWidget() {
  const prompts = [
    "Should I buy Reliance?",
    "What is the safest trade today?",
    "Which banking stocks look good?",
    "Build me a ₹50000 portfolio.",
  ];

  return (
    <div className="p-6 rounded-[20px] bg-card border border-border space-y-4 glass shadow-soft relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-accent/5 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center gap-2 text-accent">
        <Sparkles className="w-4 h-4 text-accent animate-pulse" />
        <h4 className="font-bold text-xs uppercase tracking-wider text-text-primary">Ask Quantara AI Swing Assistant</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {prompts.map((prompt, idx) => (
          <Link
            key={idx}
            href={`/ask?q=${encodeURIComponent(prompt)}`}
            className="p-3.5 rounded-xl border border-border/60 bg-secondary/15 hover:border-accent/40 text-xs font-semibold text-text-primary flex items-center justify-between group transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-accent shrink-0" />
              <span className="truncate max-w-[220px]">{prompt}</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-transform group-hover:translate-x-1 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
export default QuickAskWidget;
