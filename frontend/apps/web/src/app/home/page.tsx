"use client";

import { ArrowUpRight, ArrowDownRight, Activity, DollarSign, Users, Briefcase } from "lucide-react";
import LightweightChart from "@/components/LightweightChart";

export default function HomePage() {
  const stats = [
    { label: "Portfolio Value", value: "$124,592.15", change: "+12.4%", up: true, icon: DollarSign },
    { label: "Active Predictions", value: "18 Assets", change: "82% Win Rate", up: true, icon: Activity },
    { label: "Total Assets Tracked", value: "324 Tickers", change: "-1.2%", up: false, icon: Briefcase },
    { label: "AI Queries Today", value: "42 Queries", change: "Within limit", up: true, icon: Users },
  ];

  const recentActivity = [
    { ticker: "AAPL", type: "PREDICT", score: "0.89 Bullish", time: "10m ago", color: "text-emerald-500" },
    { ticker: "TSLA", type: "ANALYZE", score: "0.45 Neutral", time: "1h ago", color: "text-amber-500" },
    { ticker: "NVDA", type: "PORTFOLIO_BUY", score: "+$1,240.00", time: "3h ago", color: "text-emerald-500" },
    { ticker: "BTC", type: "PREDICT", score: "0.21 Bearish", time: "5h ago", color: "text-rose-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <h2 className="text-xl font-bold mb-1">Welcome back, Developer</h2>
        <p className="text-sm text-muted-foreground">
          Quantara system foundation is operational. Database, Cache, and Frontend services are fully online.
        </p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between hover:border-primary/30 transition-all hover:translate-y-[-2px]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                <div className="p-2 rounded-lg bg-secondary/50 text-muted-foreground">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-1">{stat.value}</h3>
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${stat.up ? "text-emerald-500" : "text-rose-500"}`}>
                  {stat.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Layout Grid (Main Chart and Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mock Chart Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-bold">Portfolio Performance</h3>
              <p className="text-xs text-muted-foreground">Real-time asset value visualization</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">1W</span>
              <span className="text-xs text-muted-foreground px-2.5 py-1 hover:bg-secondary rounded-full cursor-pointer">1M</span>
              <span className="text-xs text-muted-foreground px-2.5 py-1 hover:bg-secondary rounded-full cursor-pointer">1Y</span>
            </div>
          </div>
          {/* Real-time TradingView Lightweight Chart */}
          <div className="w-full pt-2">
            <LightweightChart />
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <div>
            <h3 className="font-bold">Recent System Activity</h3>
            <p className="text-xs text-muted-foreground">ML and portfolio log alerts</p>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    {activity.ticker}
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-secondary/80 font-mono text-muted-foreground">
                      {activity.type}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
                <div className={`font-mono text-xs font-semibold ${activity.color}`}>{activity.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
