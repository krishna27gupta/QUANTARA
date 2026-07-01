"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, TrendingUp, History, X, Sparkles, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StockSearchProps {
  onSelectStock: (ticker: string) => void;
  currentTicker: string;
  niftyStocks: { ticker: string; name: string; sector: string }[];
}

export function StockSearch({ onSelectStock, currentTicker, niftyStocks }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem("quantara_recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save recent search helper
  const addRecentSearch = (ticker: string) => {
    const updated = [ticker, ...recentSearches.filter((item) => item !== ticker)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("quantara_recent_searches", JSON.stringify(updated));
  };

  // Clear single recent search
  const removeRecentSearch = (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item !== ticker);
    setRecentSearches(updated);
    localStorage.setItem("quantara_recent_searches", JSON.stringify(updated));
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (ticker: string) => {
    onSelectStock(ticker);
    addRecentSearch(ticker);
    setQuery("");
    setIsOpen(false);
  };

  // Filter suggestions
  const suggestions = niftyStocks.filter(
    (stock) =>
      stock.ticker.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase()) ||
      stock.sector.toLowerCase().includes(query.toLowerCase())
  );

  const trendingSearches = ["RELIANCE", "TRENT", "HDFCBANK", "TCS"];

  return (
    <div ref={containerRef} className="relative w-full z-20">
      {/* Search Input Box */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/70 group-focus-within:text-accent transition-colors" />
        <input
          type="text"
          placeholder="Search active symbols (e.g. TCS, RELIANCE, HDFCBANK)..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          className="w-full pl-11 pr-12 py-3 text-xs md:text-sm rounded-[16px] border border-border bg-card/60 placeholder-text-secondary/60 text-text-primary outline-none focus:border-accent/60 focus:bg-card focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all font-sans"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="pointer-events-auto text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-secondary/80 border border-border/40 font-mono text-[9px] text-text-secondary uppercase select-none">
              <span>⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full rounded-2xl border border-border/70 bg-card p-4 shadow-soft glass animate-fade-in max-h-[380px] overflow-y-auto">
          {query.trim() === "" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Searches */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                  <History className="w-3 h-3 text-accent" /> Recent Searches
                </span>
                {recentSearches.length > 0 ? (
                  <div className="space-y-1">
                    {recentSearches.map((ticker) => {
                      const stock = niftyStocks.find((s) => s.ticker === ticker);
                      return (
                        <div
                          key={ticker}
                          onClick={() => handleSelect(ticker)}
                          className="flex justify-between items-center px-3 py-2 rounded-xl hover:bg-secondary/40 cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-text-primary">{ticker}</span>
                            <span className="text-[10px] text-text-secondary truncate max-w-[120px]">
                              {stock?.name || "NIFTY 50"}
                            </span>
                          </div>
                          <button
                            onClick={(e) => removeRecentSearch(e, ticker)}
                            className="p-1 rounded text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-[10px] text-text-secondary/70 block pl-3 italic">
                    No recent searches yet.
                  </span>
                )}
              </div>

              {/* Trending Searches */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" /> Trending Setups
                </span>
                <div className="space-y-1">
                  {trendingSearches.map((ticker) => {
                    const stock = niftyStocks.find((s) => s.ticker === ticker);
                    return (
                      <div
                        key={ticker}
                        onClick={() => handleSelect(ticker)}
                        className="flex justify-between items-center px-3 py-2 rounded-xl hover:bg-secondary/40 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-text-primary">{ticker}</span>
                          <span className="text-[10px] text-text-secondary truncate max-w-[120px]">
                            {stock?.name || "NIFTY 50"}
                          </span>
                        </div>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/15">
                          High Vol
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            // Search Suggestion Results
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block border-b border-border/30 pb-1.5 mb-2 pl-2">
                Scan Results ({suggestions.length})
              </span>
              {suggestions.length > 0 ? (
                suggestions.map((stock) => (
                  <div
                    key={stock.ticker}
                    onClick={() => handleSelect(stock.ticker)}
                    className="flex justify-between items-center px-3 py-2.5 rounded-xl hover:bg-secondary/50 cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center font-bold text-[10px] text-accent font-mono group-hover:bg-accent/15 group-hover:text-accent transition-colors">
                        {stock.ticker.substring(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-text-primary">{stock.ticker}</span>
                          <span className="text-[9px] bg-secondary/60 text-text-secondary/90 px-1 py-0.2 rounded font-caption">
                            {stock.sector}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-secondary block mt-0.5 truncate max-w-[200px]">
                          {stock.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Select <CornerDownLeft className="w-2.5 h-2.5" />
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-accent/40 group-hover:text-accent transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-text-secondary/70 flex flex-col items-center justify-center gap-1">
                  <span>No matching symbols found</span>
                  <span className="text-[10px] text-text-secondary/50">Search for large caps like RELIANCE, TCS, or HDFC.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StockSearch;
