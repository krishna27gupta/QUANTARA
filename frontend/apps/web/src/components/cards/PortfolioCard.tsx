"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PortfolioCardProps {
  name: string;
  balance: string;
  returns: string;
  returnsPercent: string;
  up?: boolean;
  className?: string;
}

export function PortfolioCard({
  name,
  balance,
  returns,
  returnsPercent,
  up = true,
  className,
}: PortfolioCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "var(--shadow-soft)" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "p-6 rounded-[20px] bg-gradient-to-br from-card to-secondary/15 border border-border flex flex-col justify-between h-44 w-full hover:border-accent/40 glass",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-caption text-text-secondary uppercase">{name}</span>
        <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
          <Wallet className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] text-text-secondary font-semibold">Total Equity Balance</span>
        <h3 className="font-display text-text-primary leading-none">{balance}</h3>
      </div>

      <div className="flex items-center gap-1 text-xs font-semibold mt-4">
        <span className={up ? "text-success" : "text-danger"}>
          {up ? "+" : ""}
          {returns} ({returnsPercent})
        </span>
        {up ? (
          <ArrowUpRight className="w-3.5 h-3.5 text-success" />
        ) : (
          <ArrowDownRight className="w-3.5 h-3.5 text-danger" />
        )}
      </div>
    </motion.div>
  );
}
export default PortfolioCard;
