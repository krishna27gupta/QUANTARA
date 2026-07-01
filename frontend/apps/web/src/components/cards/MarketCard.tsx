"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MarketCardProps {
  name: string;
  value: string;
  change: string;
  changePercent: string;
  up?: boolean;
  className?: string;
}

export function MarketCard({
  name,
  value,
  change,
  changePercent,
  up = true,
  className,
}: MarketCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "var(--shadow-soft)" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "p-6 rounded-[20px] bg-card border border-border flex flex-col justify-between h-40 w-full hover:border-accent/40 glass",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-caption text-text-secondary uppercase">{name}</span>
        <div className={cn("p-2 rounded-xl bg-secondary/50", up ? "text-success" : "text-danger")}>
          <Activity className="w-4 h-4" />
        </div>
      </div>
      
      <div className="space-y-1">
        <h4 className="font-heading text-text-primary">{value}</h4>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className={up ? "text-success" : "text-danger"}>
            {up ? "+" : ""}
            {change} ({changePercent})
          </span>
          {up ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-success" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5 text-danger" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
export default MarketCard;
