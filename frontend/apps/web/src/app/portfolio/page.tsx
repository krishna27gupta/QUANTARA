"use client";

import { Wallet, Landmark, TrendingUp, RefreshCw } from "lucide-react";

export default function PortfolioPage() {
  const holdings = [
    { symbol: "AAPL", name: "Apple Inc.", shares: "12.5", avgPrice: "$172.50", currentPrice: "$182.63", value: "$2,282.88", gain: "+5.87%", up: true },
    { symbol: "NVDA", name: "NVIDIA Corp.", shares: "25.0", avgPrice: "$820.00", currentPrice: "$875.12", value: "$21,878.00", gain: "+6.72%", up: true },
    { symbol: "BTC", name: "Bitcoin", shares: "0.85", avgPrice: "$65,500.00", currentPrice: "$64,250.00", value: "$54,612.50", gain: "-1.91%", up: false },
    { symbol: "ETH", name: "Ethereum", shares: "3.2", avgPrice: "$3,380.00", currentPrice: "$3,450.25", value: "$11,040.80", gain: "+2.08%", up: true },
  ];

  return (
    <div className="space-y-6">
      {/* Portfolio Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Cash Balance</span>
            <h3 className="text-xl font-bold tracking-tight">$34,780.20</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Invested Capital</span>
            <h3 className="text-xl font-bold tracking-tight">$89,811.80</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Total Equity</span>
            <h3 className="text-xl font-bold tracking-tight">$124,592.00</h3>
          </div>
        </div>
      </div>

      {/* Holdings Section */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-base">Your Holdings</h3>
          <button className="p-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground">
                <th className="p-4">Asset</th>
                <th className="p-4">Shares / Quantity</th>
                <th className="p-4">Avg Buy Price</th>
                <th className="p-4">Current Price</th>
                <th className="p-4 text-right">Holdings Value</th>
                <th className="p-4 text-right">Total Gain/Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {holdings.map((holding, i) => (
                <tr key={i} className="hover:bg-secondary/20 transition-colors">
                  <td className="p-4 font-bold flex items-center gap-2">
                    <span className="text-primary font-mono">{holding.symbol}</span>
                    <span className="text-xs text-muted-foreground font-normal hidden sm:inline">({holding.name})</span>
                  </td>
                  <td className="p-4 font-mono">{holding.shares}</td>
                  <td className="p-4 font-mono">{holding.avgPrice}</td>
                  <td className="p-4 font-mono">{holding.currentPrice}</td>
                  <td className="p-4 font-mono text-right font-semibold">{holding.value}</td>
                  <td className={`p-4 font-mono text-right font-medium ${holding.up ? "text-emerald-500" : "text-rose-500"}`}>
                    {holding.gain}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
