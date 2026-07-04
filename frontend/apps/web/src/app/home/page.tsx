"use client";

import React, { useState, useEffect } from "react";
import { PageTransition, FadeIn } from "@/components/ui/Animate";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  MarketMoodHero, 
  TradeOfTheDay, 
  CategorizedPicks, 
  MarketPulse, 
  QuickAskWidget, 
  SkeletonFeed 
} from "@/components/feed";
import { Bell, User, Calendar, Clock } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

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

  useEffect(() => {
    // Dynamic Time & Date updates
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Simulate progressive load state
    const timer = setTimeout(() => setLoading(false), 900);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const tradeData = {
    ticker: "RELIANCE",
    name: "Reliance Industries Ltd.",
    price: "₹2,845.20",
    signal: "BUY" as const,
    confidence: "92%",
    probability: "81%",
    expectedReturn: "+4.8%",
    entry: "₹2,820 - ₹2,840",
    target: "₹2,950",
    stopLoss: "₹2,775",
    riskReward: "1:2.45",
    reasons: [
      "Positive market sentiment",
      "Strong technical momentum",
      "Volume breakout",
      "Institutional buying",
      "Historical pattern similarity"
    ]
  };

  const pulseData = {
    summary: "Today's NIFTY 50 outlook appears moderately bullish. Strong earnings estimates and heavy option open interest support support boundaries near 24,400. IT index and banking sectors show immediate volume breakouts, suggesting breakout swing trades remain highly favorable.",
    fearAndGreed: 64,
    volatility: "12.45 (-2.1%)",
    bestSectors: ["Auto", "Financials", "IT Services"],
    worstSectors: ["Metal", "Media", "Realty"]
  };

  return (
    <PageTransition>
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        
        {/* Morning Intelligence Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="space-y-1">
            <h1 className="font-heading text-text-primary">
              Good Morning, {user?.name || "Trader"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                {currentDate}
              </span>
              <span className="hidden sm:inline w-1 h-1 bg-border/80 rounded-full" />
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-accent" />
                {currentTime}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="p-2.5 rounded-xl border border-border/60 hover:border-accent/40 bg-secondary/15 hover:bg-secondary/35 text-text-secondary hover:text-text-primary transition-all cursor-pointer relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-ping" />
            </button>
            <Link href="/profile">
              <button className="p-2.5 rounded-xl border border-border/60 hover:border-accent/40 bg-secondary/15 hover:bg-secondary/35 text-text-secondary hover:text-text-primary transition-all cursor-pointer flex items-center gap-1.5">
                <User className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold hidden sm:inline">Profile</span>
              </button>
            </Link>
          </div>
        </div>

        {loading ? (
          <SkeletonFeed />
        ) : (
          <FadeIn className="space-y-8">
            {/* Morning Briefing Card (Step 10 / Home Page Improvements) */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-soft glow-card overflow-hidden relative">
              {/* Background ambient radial gradient */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(0,255,135,0.06),transparent_60%)] -z-10" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] text-accent font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 border border-accent/20 inline-block">Morning Briefing</span>
                  <h2 className="text-xl font-bold text-text-primary">Good Morning, {user?.name || "Krishna"}.</h2>
                  <p className="text-sm text-text-secondary">
                    Today&apos;s market setup is <span className="text-success font-bold">BULLISH</span>. Strong earnings estimates and heavy option open interest support breakouts.
                  </p>
                </div>
                                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-center md:text-right">
                    <span className="text-[10px] text-text-secondary block font-semibold uppercase tracking-wider">Market Confidence</span>
                    <span className="text-2xl font-extrabold text-accent">
                      {isOpportunityLoading ? "..." : `${marketOpportunity?.market_confidence ?? 84}%`}
                    </span>
                  </div>
                  <div className="h-10 w-px bg-border/40 hidden sm:block" />
                  <div className="space-y-1">
                    <span className="text-[10px] text-text-secondary block font-semibold uppercase tracking-wider">Recommended Actions</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-success/10 text-success border border-success/20">Buy RELIANCE</span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-success/10 text-success border border-success/20">Watch TCS</span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-danger/10 text-danger border border-danger/20">Avoid Metals</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Market Mood */}
            {isOpportunityLoading ? (
              <div className="h-44 w-full bg-secondary/10 border border-border animate-pulse rounded-[20px]" />
            ) : (
              <MarketMoodHero
                mood={marketOpportunity?.market_sentiment === "Bullish" ? "BULLISH" : (marketOpportunity?.market_sentiment === "Bearish" ? "BEARISH" : "NEUTRAL")}
                niftyOutlook="+0.8%"
                niftyUp={true}
                opportunityScore={marketOpportunity?.opportunity_score ?? 84}
              />
            )}

            {/* Main grid splits */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left span: Trade of the day */}
              <div className="lg:col-span-2 space-y-6">
                <TradeOfTheDay {...tradeData} />
              </div>

              {/* Right span: Quick stats details */}
              <div className="bg-card border border-border rounded-[20px] p-6 space-y-4 glass shadow-soft">
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block border-b border-border/40 pb-2">
                  Account Overview
                </span>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-text-secondary block font-semibold uppercase">Paper Cash Balance</span>
                    <span className="text-2xl font-extrabold font-mono text-text-primary">₹3,78,215.15</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary block font-semibold uppercase">Daily Return (NSE)</span>
                    <span className="text-base font-extrabold font-mono text-success">+₹8,490.45 (+1.62%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Categorized pick lists */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">Categorized Opportunities</h3>
              <CategorizedPicks />
            </div>

            {/* Perplexity AI Summary */}
            <MarketPulse {...pulseData} />

            {/* Ask Quantara suggestion widget */}
            <QuickAskWidget />
          </FadeIn>
        )}
      </div>
    </PageTransition>
  );
}
