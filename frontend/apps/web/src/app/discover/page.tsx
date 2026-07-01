"use client";

import { Search, Flame, TrendingUp, Sparkles, Award } from "lucide-react";

export default function DiscoverPage() {
  const categories = [
    { name: "Trending", icon: Flame, count: "12 assets" },
    { name: "High Volatility", icon: TrendingUp, count: "8 assets" },
    { name: "AI Picked", icon: Sparkles, count: "5 assets" },
    { name: "Top Gainers", icon: Award, count: "10 assets" },
  ];

  const assets = [
    { symbol: "AAPL", name: "Apple Inc.", price: "$182.63", change: "+1.8%", up: true, category: "Tech" },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: "$875.12", change: "+4.2%", up: true, category: "AI / Chips" },
    { symbol: "BTC", name: "Bitcoin", price: "$64,250.00", change: "-2.1%", up: false, category: "Crypto" },
    { symbol: "MSFT", name: "Microsoft Corp.", price: "$415.50", change: "+0.8%", up: true, category: "Tech" },
    { symbol: "TSLA", name: "Tesla Inc.", price: "$175.46", change: "-1.5%", up: false, category: "Automotive" },
    { symbol: "ETH", name: "Ethereum", price: "$3,450.25", change: "+2.4%", up: true, category: "Crypto" },
  ];

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Discover Assets</h2>
          <p className="text-sm text-muted-foreground">Search and scan tracked markets, stocks, and crypto</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl w-full md:w-80 group focus-within:border-primary/50 transition-colors">
          <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-foreground" />
          <input
            type="text"
            placeholder="Search symbols or keywords..."
            className="bg-transparent text-sm border-none outline-none text-foreground placeholder-muted-foreground w-full"
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <div
              key={i}
              className="p-4 rounded-xl bg-card border border-border flex items-center gap-3 hover:border-primary/40 cursor-pointer transition-colors"
            >
              <div className="p-2.5 rounded-lg bg-secondary text-primary">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-sm">{cat.name}</div>
                <div className="text-xs text-muted-foreground">{cat.count}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assets Grid */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-base">Monitored Assets</h3>
        </div>
        <div className="divide-y divide-border">
          {assets.map((asset, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-secondary/35 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-sm text-primary">
                  {asset.symbol.substring(0, 2)}
                </div>
                <div>
                  <div className="font-bold text-sm">{asset.symbol}</div>
                  <div className="text-xs text-muted-foreground">{asset.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground hidden sm:inline">
                  {asset.category}
                </span>
                <div>
                  <div className="font-mono font-semibold text-sm">{asset.price}</div>
                  <div className={`font-mono text-xs font-medium ${asset.up ? "text-emerald-500" : "text-rose-500"}`}>
                    {asset.change}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
