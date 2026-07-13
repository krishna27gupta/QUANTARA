"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronRight, TrendingUp, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PredictionCardProps {
  expectedReturn: number;
  confidence: number;
  currentPrice: number;
  profitProbability: number;
}

export function PredictionCard({
  expectedReturn,
  confidence,
  currentPrice,
  profitProbability,
}: PredictionCardProps) {
  // Synthesize realistic forecast prices purely from the expected return 
  const tomorrowPrice = currentPrice * (1 + (expectedReturn / 300)); // Scaled fraction for 1 day
  const threeDayPrice = currentPrice * (1 + (expectedReturn / 150)); 
  const sevenDayPrice = currentPrice * (1 + (expectedReturn / 100)); // The expected return applies mostly here
  const rangeMin = currentPrice * (1 - (expectedReturn / 100) * 0.5);
  const rangeMax = currentPrice * (1 + (expectedReturn / 100) * 1.5);

  const getTrendIcon = (predPrice: number) => {
    return predPrice >= currentPrice ? (
      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
    ) : (
      <TrendingUp className="w-3.5 h-3.5 text-rose-500 rotate-180" />
    );
  };

  const getTrendColor = (predPrice: number) => {
    return predPrice >= currentPrice ? "text-emerald-500" : "text-rose-500";
  };

  return (
    <motion.div
      whileHover={{ y: -4, borderColor: "rgba(59, 130, 246, 0.4)", boxShadow: "var(--shadow-soft-val)" }}
      transition={{ duration: 0.2 }}
      className="p-6 rounded-[20px] bg-card border border-border space-y-5 hover:border-accent/40 glass shadow-soft relative"
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-accent" /> Price Forecasts
        </h4>
        <span className="text-[9px] px-2 py-0.5 rounded-lg bg-accent/10 text-accent font-semibold border border-accent/20">
          AI Projection
        </span>
      </div>

      {/* Grid of predictions */}
      <div className="grid grid-cols-3 gap-3">
        {/* Tomorrow */}
        <div className="p-3 bg-secondary/20 border border-border/40 rounded-xl space-y-1">
          <span className="text-[10px] text-text-secondary font-medium">Tomorrow</span>
          <div className="flex items-center gap-1">
            <span className={cn("font-mono font-bold text-sm", getTrendColor(tomorrowPrice))}>
              ₹{tomorrowPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            {getTrendIcon(tomorrowPrice)}
          </div>
          <span className="text-[8px] text-text-secondary/70 block">1-day horizon</span>
        </div>

        {/* 3 Days */}
        <div className="p-3 bg-secondary/20 border border-border/40 rounded-xl space-y-1">
          <span className="text-[10px] text-text-secondary font-medium">3 Days</span>
          <div className="flex items-center gap-1">
            <span className={cn("font-mono font-bold text-sm", getTrendColor(threeDayPrice))}>
              ₹{threeDayPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            {getTrendIcon(threeDayPrice)}
          </div>
          <span className="text-[8px] text-text-secondary/70 block">Medium range</span>
        </div>

        {/* 7 Days */}
        <div className="p-3 bg-secondary/20 border border-border/40 rounded-xl space-y-1">
          <span className="text-[10px] text-text-secondary font-medium">7 Days</span>
          <div className="flex items-center gap-1">
            <span className={cn("font-mono font-bold text-sm", getTrendColor(sevenDayPrice))}>
              ₹{sevenDayPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            {getTrendIcon(sevenDayPrice)}
          </div>
          <span className="text-[8px] text-text-secondary/70 block">Swing target</span>
        </div>
      </div>

      {/* Expected Range */}
      <div className="flex justify-between items-center p-3 bg-accent/5 border border-accent/15 rounded-xl text-xs">
        <span className="text-text-secondary flex items-center gap-1 font-semibold">
          <Compass className="w-3.5 h-3.5 text-accent" /> Expected Range
        </span>
        <span className="font-mono font-bold text-text-primary">
          ₹{rangeMin.toLocaleString("en-IN", { maximumFractionDigits: 0 })} – ₹{rangeMax.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </span>
      </div>

      {/* Prediction Tracker (Step 8) */}
      <div className="pt-3 border-t border-border/40 space-y-2">
        <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block">Active Prediction Tracker</span>
        <div className="bg-secondary/15 border border-border/30 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <div>
              <span className="text-[9px] text-text-secondary block font-bold">Predicted Target</span>
              <span className="font-mono font-bold text-emerald-400">₹{Math.round(sevenDayPrice).toLocaleString("en-IN")}</span>
            </div>
            <div className="text-center">
              <span className="text-[9px] text-text-secondary block font-bold">Current Spot</span>
              <span className="font-mono font-bold text-text-primary">₹{Math.round(currentPrice).toLocaleString("en-IN")}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-text-secondary block font-bold">Profit Prob</span>
              <span className="font-sans font-bold text-accent">{profitProbability}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-text-secondary">
              <span>Model Confidence</span>
              <span className="font-mono font-bold text-accent">{confidence}%</span>
            </div>
            <div className="w-full h-1 bg-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent rounded-full" 
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default PredictionCard;
