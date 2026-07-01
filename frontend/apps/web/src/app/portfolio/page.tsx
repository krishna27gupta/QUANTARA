"use client";

import React from "react";
import { PageTransition } from "@/components/ui/Animate";
import { PortfolioCard, ExplanationCard } from "@/components/cards";
import { PortfolioContainer } from "@/components/charts";
import { PortfolioLayout } from "@/components/layouts";
import { Landmark, ArrowUpRight } from "lucide-react";

export default function PortfolioPage() {
  const holdings = [
    { symbol: "RELIANCE", name: "Reliance Industries Ltd.", shares: "15.0", avgPrice: "₹2,780.00", currentPrice: "₹2,845.20", value: "₹42,678.00", gain: "+2.34%", up: true },
    { symbol: "HDFCBANK", name: "HDFC Bank Ltd.", shares: "40.0", avgPrice: "₹1,580.00", currentPrice: "₹1,612.45", value: "₹64,498.00", gain: "+2.05%", up: true },
    { symbol: "TCS", name: "Tata Consultancy Services Ltd.", price: "₹3,920.10", shares: "10.0", avgPrice: "₹3,950.00", currentPrice: "₹3,920.10", value: "₹39,201.00", gain: "-0.75%", up: false },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-text-primary">Your Portfolio</h2>
          <p className="text-xs text-text-secondary">Track your open swing positions and capital allocation metrics</p>
        </div>

        {/* Portfolio Layout */}
        <PortfolioLayout
          summaryCards={
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PortfolioCard
                name="Total Portfolio Value"
                balance="₹5,24,592.15"
                returns="₹24,592.15"
                returnsPercent="4.92%"
                up={true}
              />
              {/* Cash Balance Card */}
              <div className="p-6 rounded-[20px] bg-card border border-border flex items-center gap-4 glass">
                <div className="p-3 rounded-xl bg-accent/10 text-accent">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary font-semibold block uppercase">Cash Available</span>
                  <h3 className="text-lg font-bold font-mono text-text-primary">₹3,78,215.15</h3>
                </div>
              </div>
              {/* Win Index */}
              <div className="p-6 rounded-[20px] bg-card border border-border flex items-center gap-4 glass">
                <div className="p-3 rounded-xl bg-success/10 text-success">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary font-semibold block uppercase">Win Rate (30d)</span>
                  <h3 className="text-lg font-bold font-mono text-success">72.4%</h3>
                </div>
              </div>
            </div>
          }
          holdingsTable={
            <div className="bg-card border border-border rounded-[20px] overflow-hidden glass shadow-soft">
              <div className="p-5 border-b border-border/40">
                <h3 className="font-bold text-sm text-text-primary">Active Holdings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/25 border-b border-border/40 text-[10px] font-bold text-text-secondary uppercase">
                      <th className="p-4">Symbol</th>
                      <th className="p-4">Shares</th>
                      <th className="p-4">Buy Avg</th>
                      <th className="p-4">Current Price</th>
                      <th className="p-4 text-right">Value</th>
                      <th className="p-4 text-right">Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 text-xs">
                    {holdings.map((hold, i) => (
                      <tr key={i} className="hover:bg-secondary/10 transition-colors">
                        <td className="p-4 font-bold flex items-center gap-2">
                          <span className="text-accent font-mono">{hold.symbol}</span>
                          <span className="text-[10px] text-text-secondary font-normal hidden sm:inline">({hold.name})</span>
                        </td>
                        <td className="p-4 font-mono">{hold.shares}</td>
                        <td className="p-4 font-mono">{hold.avgPrice}</td>
                        <td className="p-4 font-mono">{hold.currentPrice}</td>
                        <td className="p-4 font-mono text-right font-semibold text-text-primary">{hold.value}</td>
                        <td className={`p-4 font-mono text-right font-bold ${hold.up ? "text-success" : "text-danger"}`}>
                          {hold.gain}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          }
          chartsSection={
            <div className="space-y-6">
              <PortfolioContainer title="Asset Allocation Breakdown" equityValue="₹1,46,377.00">
                <div className="w-full h-full p-4 flex flex-col justify-around text-xs font-semibold">
                  {[
                    { name: "Reliance", share: 29, color: "bg-accent" },
                    { name: "HDFC Bank", share: 44, color: "bg-success" },
                    { name: "TCS", share: 27, color: "bg-amber-500" },
                  ].map((asset, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-sm ${asset.color}`} />
                        <span className="text-text-primary">{asset.name}</span>
                      </div>
                      <span className="font-mono text-text-secondary">{asset.share}%</span>
                    </div>
                  ))}
                </div>
              </PortfolioContainer>
              <ExplanationCard
                title="Portfolio Allocation Rationale"
                explanation="Cash allocation remains high (72%) to capitalize on upcoming swing breakouts. Financial exposure dominates the active invested capital."
              />
            </div>
          }
        />
      </div>
    </PageTransition>
  );
}
