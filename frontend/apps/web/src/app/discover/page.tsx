"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageTransition } from "@/components/ui/Animate";
import { DashboardLayout } from "@/components/layouts";
import { MarketOverview } from "@/components/discover/MarketOverview";
import { SectorHeatmap } from "@/components/discover/SectorHeatmap";
import { PersonalizedPicks } from "@/components/discover/PersonalizedPicks";
import { AISummary } from "@/components/discover/AISummary";
import { WatchlistPanel, WatchlistItem } from "@/components/discover/WatchlistPanel";
import { StockCard } from "@/components/cards/StockCard";
import { 
  Search, 
  SlidersHorizontal, 
  RefreshCw, 
  Clock, 
  Flame, 
  Shield, 
  Zap, 
  X,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Interface for stock opportunity data
interface StockOpportunity {
  ticker: string;
  name: string;
  price: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  profitProbability: number;
  expectedReturn: string;
  risk: "Low" | "Medium" | "High";
  sector: string;
  marketCap: "Large Cap" | "Mid Cap" | "Small Cap";
  rsi?: number;
  macd?: string;
  volume?: string;
}

const ALL_STOCKS: StockOpportunity[] = [
  { ticker: "RELIANCE", name: "Reliance Industries Ltd.", price: "₹2,845.20", signal: "BUY", confidence: 84, profitProbability: 72, expectedReturn: "+6.1%", risk: "Medium", sector: "Energy", marketCap: "Large Cap", rsi: 62, macd: "Bullish Cross", volume: "High" },
  { ticker: "TCS", name: "Tata Consultancy Services Ltd.", price: "₹3,920.10", signal: "BUY", confidence: 78, profitProbability: 68, expectedReturn: "+4.8%", risk: "Low", sector: "IT", marketCap: "Large Cap", rsi: 54, macd: "Neutral", volume: "Medium" },
  { ticker: "HDFCBANK", name: "HDFC Bank Ltd.", price: "₹1,612.45", signal: "BUY", confidence: 82, profitProbability: 74, expectedReturn: "+5.5%", risk: "Low", sector: "Banking", marketCap: "Large Cap", rsi: 58, macd: "Bullish", volume: "High" },
  { ticker: "ITC", name: "ITC Ltd.", price: "₹425.80", signal: "BUY", confidence: 86, profitProbability: 80, expectedReturn: "+3.5%", risk: "Low", sector: "FMCG", marketCap: "Large Cap", rsi: 48, macd: "Strong Bullish", volume: "High" },
  { ticker: "ASIANPAINTS", name: "Asian Paints Ltd.", price: "₹2,890.30", signal: "BUY", confidence: 81, profitProbability: 70, expectedReturn: "+4.2%", risk: "Low", sector: "Consumer", marketCap: "Large Cap", rsi: 51, macd: "Neutral", volume: "Medium" },
  { ticker: "TRENT", name: "Trent Ltd. (Tata Group)", price: "₹4,850.00", signal: "BUY", confidence: 89, profitProbability: 75, expectedReturn: "+12.4%", risk: "High", sector: "Retail", marketCap: "Mid Cap", rsi: 72, macd: "Strong Bullish", volume: "High" },
  { ticker: "ADANI PORTS", name: "Adani Ports & SEZ Ltd.", price: "₹1,240.15", signal: "BUY", confidence: 83, profitProbability: 67, expectedReturn: "+9.8%", risk: "High", sector: "Infrastructure", marketCap: "Large Cap", rsi: 65, macd: "Bullish Cross", volume: "High" },
  { ticker: "BAJAJ FINANCE", name: "Bajaj Finance Ltd.", price: "₹6,950.00", signal: "BUY", confidence: 80, profitProbability: 69, expectedReturn: "+8.5%", risk: "High", sector: "Banking", marketCap: "Large Cap", rsi: 59, macd: "Bullish Crossover", volume: "High" },
  { ticker: "M&M", name: "Mahindra & Mahindra Ltd.", price: "₹2,140.50", signal: "HOLD", confidence: 65, profitProbability: 55, expectedReturn: "+1.2%", risk: "Medium", sector: "Auto", marketCap: "Large Cap", rsi: 41, macd: "Weak Bearish", volume: "Medium" },
  { ticker: "SUNPHARMA", name: "Sun Pharmaceutical Industries", price: "₹1,520.40", signal: "HOLD", confidence: 71, profitProbability: 60, expectedReturn: "+2.8%", risk: "Medium", sector: "Pharma", marketCap: "Large Cap", rsi: 50, macd: "Neutral", volume: "Medium" },
  { ticker: "TATASTEEL", name: "Tata Steel Ltd.", price: "₹145.20", signal: "SELL", confidence: 60, profitProbability: 45, expectedReturn: "-3.4%", risk: "High", sector: "Metals", marketCap: "Large Cap", rsi: 29, macd: "Bearish Cross", volume: "High" }
];

export default function DiscoverPage() {
  // Navigation tabs: Top Picks, Safe Picks, Aggressive Picks
  const [activeTab, setActiveTab] = useState<"top" | "safe" | "aggressive">("top");
  
  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [minConfidence, setMinConfidence] = useState(60);
  const [minExpectedReturn, setMinExpectedReturn] = useState(0);
  const [selectedCap, setSelectedCap] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);

  // Time indicator state
  const [currentTime, setCurrentTime] = useState("");

  // Loading Screen simulation
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Watchlist State (in-memory persistent mockup)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { ticker: "HDFCBANK", name: "HDFC Bank Ltd.", price: "₹1,612.45", change: "+2.10%", up: true },
    { ticker: "RELIANCE", name: "Reliance Industries Ltd.", price: "₹2,845.20", change: "+1.42%", up: true }
  ]);

  // Market opportunity state
  const [marketOpportunity, setMarketOpportunity] = useState<{
    market_confidence: number;
    opportunity_score: number;
    market_regime: string;
    market_sentiment: string;
    vix: number;
  } | null>(null);
  const [isOpportunityLoading, setIsOpportunityLoading] = useState(true);

  useEffect(() => {
    async function fetchOpportunity() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/market-opportunity");
        if (res.ok) {
          const data = await res.json();
          setMarketOpportunity(data);
        }
      } catch (err) {
        console.error("Failed to fetch market opportunity score:", err);
      } finally {
        setIsOpportunityLoading(false);
      }
    }
    fetchOpportunity();
  }, []);

  // Clock updating
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCurrentTime(
        date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric"
        }) + " | " + 
        date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initial loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Refresh handler (progressive skeleton loader)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsRefreshing(false);
    }, 1500);
  };

  // Watchlist toggle handler
  const handleWatchlistToggle = (ticker: string) => {
    const isPresent = watchlist.some((item) => item.ticker === ticker);
    if (isPresent) {
      setWatchlist(watchlist.filter((item) => item.ticker !== ticker));
    } else {
      const stock = ALL_STOCKS.find((s) => s.ticker === ticker);
      if (stock) {
        const isUp = !stock.expectedReturn.startsWith("-");
        setWatchlist([
          ...watchlist,
          {
            ticker: stock.ticker,
            name: stock.name,
            price: stock.price,
            change: stock.expectedReturn,
            up: isUp
          }
        ]);
      }
    }
  };

  const handleWatchlistSelect = (ticker: string) => {
    // Quick analyze or filter focus
    setSearchQuery(ticker);
  };

  // Quick compare handler
  const handleCompare = (ticker: string) => {
    alert(`Added ${ticker} to Comparison matrix.`);
  };

  // Quick analyze handler
  const handleAnalyze = (ticker: string) => {
    window.location.href = `/analyze?symbol=${ticker}`;
  };

  // Sector selection from Heatmap
  const handleSectorSelect = (sector: string | null) => {
    setSelectedSector(sector);
  };

  // Computed and filtered list of Stocks
  const filteredStocks = useMemo(() => {
    // 1. Filter by Active Tab
    let list = [...ALL_STOCKS];
    if (activeTab === "safe") {
      // Low Volatility / Risk, High Confidence
      list = list.filter((s) => s.risk === "Low" && s.confidence >= 75);
    } else if (activeTab === "aggressive") {
      // High Volatility / Risk, High Reward
      list = list.filter((s) => s.risk === "High");
    }

    // 2. Filter by Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.ticker.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q)
      );
    }

    // 3. Filter by Sector
    if (selectedSector) {
      list = list.filter((s) => s.sector.toLowerCase() === selectedSector.toLowerCase());
    }

    // 4. Filter by Risk
    if (selectedRisk) {
      list = list.filter((s) => s.risk === selectedRisk);
    }

    // 5. Filter by Signal
    if (selectedSignal) {
      list = list.filter((s) => s.signal === selectedSignal);
    }

    // 6. Filter by Min Confidence
    list = list.filter((s) => s.confidence >= minConfidence);

    // 7. Filter by Expected Return
    if (minExpectedReturn > 0) {
      list = list.filter((s) => {
        const value = parseFloat(s.expectedReturn.replace(/[+%]/g, ""));
        return value >= minExpectedReturn;
      });
    }

    // 8. Filter by Market Cap
    if (selectedCap) {
      list = list.filter((s) => s.marketCap === selectedCap);
    }

    return list;
  }, [
    activeTab,
    searchQuery,
    selectedSector,
    selectedRisk,
    minConfidence,
    minExpectedReturn,
    selectedCap,
    selectedSignal
  ]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedSector !== null ||
      selectedRisk !== null ||
      selectedCap !== null ||
      selectedSignal !== null ||
      minConfidence > 60 ||
      minExpectedReturn > 0
    );
  }, [selectedSector, selectedRisk, selectedCap, selectedSignal, minConfidence, minExpectedReturn]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedSector(null);
    setSelectedRisk(null);
    setSelectedCap(null);
    setSelectedSignal(null);
    setMinConfidence(60);
    setMinExpectedReturn(0);
    setSearchQuery("");
  };

  // Skeleton Loader Card
  const SkeletonCard = () => (
    <div className="p-5 rounded-[20px] bg-card/40 border border-border/60 flex items-center justify-between w-full h-[86px] animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-[14px] bg-secondary/80" />
        <div className="space-y-2">
          <div className="w-20 h-4 bg-secondary/80 rounded" />
          <div className="w-32 h-3 bg-secondary/60 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="w-14 h-6 bg-secondary/60 rounded-lg hidden md:block" />
        <div className="w-16 h-4 bg-secondary/60 rounded hidden md:block" />
        <div className="space-y-1 text-right">
          <div className="w-16 h-4 bg-secondary/80 rounded" />
          <div className="w-12 h-3 bg-secondary/60 rounded ml-auto" />
        </div>
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Dynamic Premium Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-border/40 pb-5">
          <div>
            <h2 className="font-heading text-text-primary text-2xl md:text-3xl font-extrabold tracking-tight">
              Discover Opportunities
            </h2>
            <p className="text-xs md:text-sm text-text-secondary mt-1 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              AI-curated market opportunities for swing traders.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:w-72 xl:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/70" />
              <input
                type="text"
                placeholder="Search symbol, company, or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl border border-border bg-card/60 placeholder-text-secondary/60 text-text-primary outline-none focus:border-accent/60 focus:bg-card focus:shadow-[0_0_12px_rgba(59,130,246,0.15)] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sub Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={cn(
                  "flex-1 sm:flex-none px-4 py-2 rounded-xl border border-border text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  isFilterPanelOpen || hasActiveFilters
                    ? "bg-accent/15 text-accent border-accent/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                    : "bg-card/40 hover:bg-secondary/40 text-text-primary"
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                )}
              </button>

              <button
                onClick={handleRefresh}
                className="p-2 rounded-xl border border-border bg-card/40 hover:bg-secondary/40 text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                title="Refresh Opportunities"
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-accent")} />
              </button>

              {/* Time Indicator */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/30 border border-border/40 text-[10px] font-mono text-text-secondary">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>{currentTime || "Loading Market Time..."}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Advanced Filter System Panel */}
        <AnimatePresence>
          {isFilterPanelOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border border-border bg-card/50 rounded-[20px] glass p-5 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-accent" /> Advanced Opportunities Filter
                </h4>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-[10px] font-semibold text-rose-400 hover:text-rose-500 flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Clear All Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sector Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Sector</label>
                  <select
                    value={selectedSector || ""}
                    onChange={(e) => setSelectedSector(e.target.value || null)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-secondary/40 text-text-primary focus:border-accent outline-none"
                  >
                    <option value="">All Sectors</option>
                    <option value="banking">Banking</option>
                    <option value="it">IT</option>
                    <option value="energy">Energy</option>
                    <option value="pharma">Pharma</option>
                    <option value="auto">Auto</option>
                    <option value="fmcg">FMCG</option>
                    <option value="metals">Metals</option>
                    <option value="consumer">Consumer</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="retail">Retail</option>
                  </select>
                </div>

                {/* Risk Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Risk Profile</label>
                  <select
                    value={selectedRisk || ""}
                    onChange={(e) => setSelectedRisk(e.target.value || null)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-secondary/40 text-text-primary focus:border-accent outline-none"
                  >
                    <option value="">All Risks</option>
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>

                {/* Market Cap */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Market Cap</label>
                  <select
                    value={selectedCap || ""}
                    onChange={(e) => setSelectedCap(e.target.value || null)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-secondary/40 text-text-primary focus:border-accent outline-none"
                  >
                    <option value="">All Caps</option>
                    <option value="Large Cap">Large Cap</option>
                    <option value="Mid Cap">Mid Cap</option>
                    <option value="Small Cap">Small Cap</option>
                  </select>
                </div>

                {/* Signal Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Trade Signal</label>
                  <select
                    value={selectedSignal || ""}
                    onChange={(e) => setSelectedSignal(e.target.value || null)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-secondary/40 text-text-primary focus:border-accent outline-none"
                  >
                    <option value="">All Signals</option>
                    <option value="BUY">BUY Setups</option>
                    <option value="HOLD">HOLD Signals</option>
                    <option value="SELL">SELL Triggers</option>
                  </select>
                </div>
              </div>

              {/* Sliders Range Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Min Confidence */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold text-text-secondary uppercase tracking-wider">Min AI Confidence</span>
                    <span className="font-mono text-accent font-bold">{minConfidence}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(Number(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                {/* Expected Return */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold text-text-secondary uppercase tracking-wider">Min Expected Return</span>
                    <span className="font-mono text-accent font-bold">+{minExpectedReturn}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={minExpectedReturn}
                    onChange={(e) => setMinExpectedReturn(Number(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Grid System */}
        <DashboardLayout
          sidebar={
            <>
              {/* Personalized Picks Section */}
              <PersonalizedPicks />

              {/* AI Market Summary Component */}
              <AISummary />

              {/* Quick Watchlist Panel */}
              <WatchlistPanel 
                items={watchlist} 
                onRemove={handleWatchlistToggle} 
                onSelect={handleWatchlistSelect} 
              />
            </>
          }
        >
          {/* Market Overview Core stats */}
          <MarketOverview 
            mood={marketOpportunity?.market_sentiment === "Bullish" ? "Bullish" : (marketOpportunity?.market_sentiment === "Bearish" ? "Bearish" : "Neutral")}
            niftyPred={0.8}
            fearGreed={67}
            volatility={marketOpportunity ? (marketOpportunity.vix > 18 ? "High" : (marketOpportunity.vix > 15 ? "Medium" : "Low")) : "Low"}
            oppScore={marketOpportunity?.opportunity_score}
            isLoading={isOpportunityLoading}
          />

          {/* Opportunities Section */}
          <div className="space-y-4">
            {/* Header Tabs Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/30 pb-1">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("top")}
                  className={cn(
                    "pb-3 text-xs md:text-sm font-semibold border-b-2 px-1 relative transition-colors cursor-pointer",
                    activeTab === "top"
                      ? "border-accent text-accent"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-accent animate-pulse" /> {"Today's Top Picks"}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("safe")}
                  className={cn(
                    "pb-3 text-xs md:text-sm font-semibold border-b-2 px-1 relative transition-colors cursor-pointer",
                    activeTab === "safe"
                      ? "border-emerald-500 text-emerald-500"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" /> Safe Picks
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("aggressive")}
                  className={cn(
                    "pb-3 text-xs md:text-sm font-semibold border-b-2 px-1 relative transition-colors cursor-pointer",
                    activeTab === "aggressive"
                      ? "border-rose-500 text-rose-500"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-rose-500" /> Aggressive Picks
                  </span>
                </button>
              </div>

              {/* Quick Results Summary */}
              <span className="text-[10px] text-text-secondary font-bold font-mono pb-3">
                {isLoading ? "Scanning..." : `${filteredStocks.length} Entry Setups Found`}
              </span>
            </div>

            {/* Active filters pill list */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-1.5 items-center bg-secondary/15 border border-border/40 p-2 rounded-xl">
                <span className="text-[10px] text-text-secondary font-bold mr-1 flex items-center gap-0.5">
                  Active Scanner Filters:
                </span>
                
                {selectedSector && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded-full">
                    Sector: {selectedSector}
                    <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSelectedSector(null)} />
                  </span>
                )}
                
                {selectedRisk && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded-full">
                    Risk: {selectedRisk}
                    <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSelectedRisk(null)} />
                  </span>
                )}

                {selectedCap && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded-full">
                    Cap: {selectedCap}
                    <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSelectedCap(null)} />
                  </span>
                )}

                {selectedSignal && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded-full">
                    Signal: {selectedSignal}
                    <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSelectedSignal(null)} />
                  </span>
                )}

                {minConfidence > 60 && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded-full">
                    Confidence: &gt;={minConfidence}%
                    <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setMinConfidence(60)} />
                  </span>
                )}

                {minExpectedReturn > 0 && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded-full">
                    Return: &gt;=+{minExpectedReturn}%
                    <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setMinExpectedReturn(0)} />
                  </span>
                )}

                <button 
                  onClick={resetFilters} 
                  className="text-[9px] font-bold text-rose-500 hover:underline pl-1 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Main Opportunities List (with Framer Motion animation) */}
            <div className="grid grid-cols-1 gap-3.5">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  // Progressive Skeleton Loading Experience
                  Array.from({ length: 4 }).map((_, idx) => (
                    <motion.div
                      key={`skeleton-${idx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <SkeletonCard />
                    </motion.div>
                  ))
                ) : filteredStocks.length > 0 ? (
                  filteredStocks.map((stock) => {
                    const isWatched = watchlist.some((w) => w.ticker === stock.ticker);
                    return (
                      <StockCard
                        key={stock.ticker}
                        {...stock}
                        isWatched={isWatched}
                        onWatchlistToggle={handleWatchlistToggle}
                        onCompare={handleCompare}
                        onAnalyze={handleAnalyze}
                      />
                    );
                  })
                ) : (
                  // Empty State
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 border border-dashed border-border rounded-[20px] bg-secondary/5 text-center flex flex-col items-center justify-center gap-3"
                  >
                    <div className="p-3 bg-secondary/50 rounded-2xl border border-border/80 text-text-secondary">
                      <SlidersHorizontal className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-primary">No setups match active criteria</h4>
                      <p className="text-xs text-text-secondary/70 mt-1 max-w-[280px] mx-auto">
                        Try loosening confidence parameters or clearing filters to locate swing trades.
                      </p>
                    </div>
                    <button
                      onClick={resetFilters}
                      className="px-3.5 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors cursor-pointer"
                    >
                      Reset Scanner Filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Interactive Sector Heatmap Component */}
          <SectorHeatmap 
            onSectorSelect={handleSectorSelect}
            selectedSector={selectedSector}
          />
        </DashboardLayout>
      </div>
    </PageTransition>
  );
}
