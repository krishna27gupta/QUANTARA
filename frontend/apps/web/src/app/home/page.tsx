"use client";

import React from "react";
import { PageTransition } from "@/components/ui/Animate";
import { DashboardLayout } from "@/components/layouts";
import { PortfolioCard, MarketCard, ExplanationCard } from "@/components/cards";
import { PerformanceContainer } from "@/components/charts";
import LightweightChart from "@/components/LightweightChart";
import { Sparkles, ArrowUpRight } from "lucide-react";

export default function HomePage() {
  const marketIndices = [
    { name: "NIFTY 50", value: "24,505.80", change: "110.60", changePercent: "0.45%", up: true },
    { name: "SENSEX", value: "80,312.45", change: "342.10", changePercent: "0.43%", up: true },
    { name: "NIFTY BANK", value: "52,142.10", change: "-120.40", changePercent: "0.23%", up: false },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Upper Banner Greeting */}
        <div className="p-6 rounded-[20px] bg-gradient-to-r from-accent/15 via-accent/5 to-transparent border border-accent/25 relative overflow-hidden glass">
          <div className="absolute top-0 right-0 w-44 h-44 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
          <h2 className="font-heading text-text-primary mb-1.5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            Quantara Swing Trading Copilot
          </h2>
          <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
            Welcome back! The market analyzer is tracking NIFTY 50 assets. Standard quantitative and AI models are operational.
          </p>
        </div>

        {/* Home Layout */}
        <DashboardLayout
          sidebar={
            <>
              {/* Performance Indicator Column */}
              <PerformanceContainer title="AI Pipeline Performance" metric="+18.4% Monthly" />
              
              {/* Daily AI explanation snippet */}
              <ExplanationCard
                title="Market Briefing"
                explanation="Indices are hovering near key support resistance bounds. Consolidation is expected before the weekly option expiry. Favor long setups on high beta auto stocks."
                sourceDocs={["NIFTY_EMA_50.csv", "RSI_NSE_DAILY.log"]}
              />
            </>
          }
        >
          {/* Market Indices Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {marketIndices.map((idx, i) => (
              <MarketCard key={i} {...idx} />
            ))}
          </div>

          {/* Main Portfolio Value Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            <div className="md:col-span-2">
              <PortfolioCard
                name="Paper Account Equity"
                balance="₹5,24,592.15"
                returns="₹24,592.15"
                returnsPercent="4.92%"
                up={true}
              />
            </div>
            {/* Quick action card */}
            <div className="p-6 rounded-[20px] bg-card border border-border flex flex-col justify-between hover:border-accent/40 glass">
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Trading Status</span>
              <div>
                <div className="text-xl font-bold text-success flex items-center gap-1">
                  Active <ArrowUpRight className="w-5 h-5 animate-pulse" />
                </div>
                <span className="text-[10px] text-text-secondary block mt-1">2 active swing trades running</span>
              </div>
            </div>
          </div>

          {/* Chart performance */}
          <div className="p-6 rounded-[20px] bg-card border border-border space-y-4 glass shadow-soft">
            <div>
              <h3 className="font-bold text-sm text-text-primary">Interactive Market Chart</h3>
              <p className="text-[10px] text-text-secondary">Interactive TradingView Canvas Rendering</p>
            </div>
            <div className="w-full pt-2">
              <LightweightChart />
            </div>
          </div>
        </DashboardLayout>
      </div>
    </PageTransition>
  );
}
