"use client";

import React, { useState } from "react";
import { PageTransition } from "@/components/ui/Animate";
import { SearchInput, FilterInput } from "@/components/ui/Input";
import { StockCard, ExplanationCard } from "@/components/cards";
import { DashboardLayout } from "@/components/layouts";
import { Flame } from "lucide-react";

export default function DiscoverPage() {
  const [filter, setFilter] = useState("all");

  const filterOptions = [
    { label: "All Tickers", value: "all" },
    { label: "Tech Stocks", value: "tech" },
    { label: "Automotive", value: "auto" },
    { label: "Financials", value: "financial" },
  ];

  const stocks = [
    { ticker: "RELIANCE", name: "Reliance Industries Ltd.", price: "₹2,845.20", change: "+1.42%", up: true, category: "auto" },
    { ticker: "TCS", name: "Tata Consultancy Services Ltd.", price: "₹3,920.10", change: "-0.85%", up: false, category: "tech" },
    { ticker: "HDFCBANK", name: "HDFC Bank Ltd.", price: "₹1,612.45", change: "+2.10%", up: true, category: "financial" },
    { ticker: "INFY", name: "Infosys Ltd.", price: "₹1,480.60", change: "+1.15%", up: true, category: "tech" },
    { ticker: "ICICIBANK", name: "ICICI Bank Ltd.", price: "₹1,142.90", change: "+0.45%", up: true, category: "financial" },
    { ticker: "M&M", name: "Mahindra & Mahindra Ltd.", price: "₹2,140.50", change: "-1.75%", up: false, category: "auto" },
  ];

  const filteredStocks = filter === "all" ? stocks : stocks.filter(s => s.category === filter);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <h2 className="font-heading text-text-primary">Discover Assets</h2>
            <p className="text-xs text-text-secondary">Scan NIFTY 50 securities and monitor trade signals</p>
          </div>
          <div className="w-full md:w-80">
            <SearchInput placeholder="Search active symbols (e.g. TCS)..." />
          </div>
        </div>

        {/* Dashboard Layout */}
        <DashboardLayout
          sidebar={
            <>
              {/* Category briefing */}
              <div className="p-5 rounded-[20px] bg-card border border-border space-y-3 glass shadow-soft">
                <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-accent animate-pulse" />
                  NIFTY 50 Sectors
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Financials and IT sectors currently dictate index volume direction. Swing positions should align with daily volumes.
                </p>
              </div>

              {/* RAG references */}
              <ExplanationCard
                title="Screener Insight"
                explanation="Screener algorithms scan relative strength indices across NIFTY 50 daily. Current scan reports HDFCBANK showing oversold rebound signals."
                sourceDocs={["NSE_SCREENER.log"]}
              />
            </>
          }
        >
          {/* Filter Bar */}
          <div className="flex justify-between items-center py-1">
            <FilterInput
              options={filterOptions}
              selectedValue={filter}
              onChange={setFilter}
            />
            <span className="text-[10px] text-text-secondary font-bold font-mono">
              {filteredStocks.length} tracked assets
            </span>
          </div>

          {/* Stocks Card List Grid */}
          <div className="grid grid-cols-1 gap-3.5">
            {filteredStocks.map((stock, i) => (
              <StockCard key={i} {...stock} />
            ))}
          </div>
        </DashboardLayout>
      </div>
    </PageTransition>
  );
}
