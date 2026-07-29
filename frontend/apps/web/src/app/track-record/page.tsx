"use client";

import React, { useState, useEffect } from "react";
import { PageTransition, FadeIn } from "@/components/ui/Animate";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Target,
  BarChart,
  CheckCircle,
  HelpCircle,
  Info
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TrackRecordData {
  status: string;
  total_validation_trades?: number;
  data_sources?: string[];
  validation_period?: {
    start: string;
    end: string;
  };
  trend_profit?: {
    status: string;
    sample_size: number;
    caveat?: string;
    realized_win_rate?: {
      value: number;
      ci_95_lower: number;
      ci_95_upper: number;
      unit: string;
    };
    realized_pnl?: {
      mean_pct: number;
      median_pct: number;
      total_trades: number;
      winning_trades: number;
      losing_trades: number;
    };
    exit_reasons?: Record<string, number>;
    backtest_comparison?: {
      backtest_profit_auc: number;
      backtest_trend_auc: number;
      note: string;
    };
  };
  risk?: {
    status: string;
    sample_size: number;
    caveat?: string;
    stop_loss_rate?: {
      value: number;
      ci_95_lower: number;
      ci_95_upper: number;
      interpretation: string;
    };
    backtest_comparison?: {
      backtest_accuracy: number;
      random_baseline: number;
      note: string;
    };
    data_limitation?: string;
  };
  expected_return?: {
    status: string;
    sample_size: number;
    caveat?: string;
    realized_return_distribution?: {
      mean_pct: number;
      std_pct: number;
      empirical_quantiles: Record<string, number>;
    };
    backtest_comparison?: {
      backtest_r2: number;
      backtest_band_calibration: number;
      note: string;
    };
    data_limitation?: string;
  };
  methodology_note?: string;
  message?: string;
}

export default function TrackRecordPage() {
  const [data, setData] = useState<TrackRecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/track-record");
        if (!res.ok) throw new Error("Failed to fetch track record");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-danger">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Error Loading Track Record</h2>
        <p className="mt-2">{error || "No data available"}</p>
      </div>
    );
  }

  if (data.status === "no_data") {
    return (
      <PageTransition>
        <div className="p-8 max-w-4xl mx-auto text-center mt-20">
          <Activity className="w-16 h-16 text-text-muted mx-auto mb-6" />
          <h1 className="text-3xl font-bold font-heading mb-4">Track Record</h1>
          <div className="p-6 bg-card border border-border rounded-xl">
            <h2 className="text-xl font-semibold text-text-primary mb-2">No Validation Data Yet</h2>
            <p className="text-text-secondary">{data.message}</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="border-b border-border/40 pb-5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-accent font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
              Calibration
            </span>
            <span className="text-[10px] text-text-secondary">
              N={data.total_validation_trades} Live Paper Trades
            </span>
          </div>
          <h1 className="font-heading text-text-primary mt-2 flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent" />
            Model Track Record
          </h1>
          <p className="text-xs text-text-secondary mt-2 max-w-3xl leading-relaxed">
            {data.methodology_note}
          </p>
        </div>

        {/* 1. Risk Model Track Record */}
        <FadeIn delay={0.1}>
          <section className="bg-card border border-border rounded-2xl overflow-hidden glass shadow-soft">
            <div className="border-b border-border/40 p-5 bg-secondary/20">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                Risk Model Calibration
              </h2>
            </div>
            <div className="p-6">
              {data.risk?.status === "insufficient_data" ? (
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm text-text-primary">{data.risk.caveat}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    {data.risk?.caveat && (
                      <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2 mb-4">
                        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        <p className="text-xs text-text-primary">{data.risk.caveat}</p>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">
                        Realized Stop-Loss Hit Rate
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono">
                          {data.risk?.stop_loss_rate?.value}%
                        </span>
                        <span className="text-xs text-text-muted font-mono">
                          (95% CI: {data.risk?.stop_loss_rate?.ci_95_lower}% – {data.risk?.stop_loss_rate?.ci_95_upper}%)
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-2 border-l-2 border-accent/50 pl-3">
                        {data.risk?.stop_loss_rate?.interpretation}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 bg-secondary/10 p-4 rounded-xl border border-border/50">
                    <h3 className="text-xs font-semibold text-text-secondary uppercase">Backtest Context</h3>
                    <div className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                      <span className="text-text-muted">Backtest Accuracy</span>
                      <span className="font-mono">{((data.risk?.backtest_comparison?.backtest_accuracy || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                      <span className="text-text-muted">Random Baseline</span>
                      <span className="font-mono">{((data.risk?.backtest_comparison?.random_baseline || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-2">
                      {data.risk?.backtest_comparison?.note}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </FadeIn>

        {/* 2. Trend & Profit Model Track Record */}
        <FadeIn delay={0.2}>
          <section className="bg-card border border-border rounded-2xl overflow-hidden glass shadow-soft">
            <div className="border-b border-border/40 p-5 bg-secondary/20">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                Trend & Profitability Signal
              </h2>
            </div>
            <div className="p-6">
              {data.trend_profit?.status === "insufficient_data" ? (
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm text-text-primary">{data.trend_profit.caveat}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {data.trend_profit?.caveat && (
                      <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        <p className="text-xs text-text-primary">{data.trend_profit.caveat}</p>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">
                        Realized Win Rate
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono">
                          {data.trend_profit?.realized_win_rate?.value}%
                        </span>
                        <span className="text-xs text-text-muted font-mono">
                          (95% CI: {data.trend_profit?.realized_win_rate?.ci_95_lower}% – {data.trend_profit?.realized_win_rate?.ci_95_upper}%)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border border-border/50 rounded-lg bg-secondary/5">
                        <div className="text-[10px] text-text-secondary uppercase mb-1">Median Trade PnL</div>
                        <div className={cn("font-mono font-bold", (data.trend_profit?.realized_pnl?.median_pct || 0) >= 0 ? "text-success" : "text-danger")}>
                          {(data.trend_profit?.realized_pnl?.median_pct || 0) > 0 ? "+" : ""}{data.trend_profit?.realized_pnl?.median_pct}%
                        </div>
                      </div>
                      <div className="p-3 border border-border/50 rounded-lg bg-secondary/5">
                        <div className="text-[10px] text-text-secondary uppercase mb-1">Win / Loss Ratio</div>
                        <div className="font-mono font-bold">
                          {data.trend_profit?.realized_pnl?.winning_trades}W / {data.trend_profit?.realized_pnl?.losing_trades}L
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-secondary/10 p-4 rounded-xl border border-border/50">
                      <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3">Exit Breakdown</h3>
                      <div className="space-y-2">
                        {Object.entries(data.trend_profit?.exit_reasons || {}).map(([reason, count]) => (
                          <div key={reason} className="flex items-center justify-between text-xs">
                            <span className="text-text-muted">{reason.replace("_", " ")}</span>
                            <span className="font-mono font-medium">{count} trades</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-secondary/10 p-4 rounded-xl border border-border/50">
                      <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3">Backtest Context</h3>
                      <div className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                        <span className="text-text-muted">Profit Model AUC</span>
                        <span className="font-mono">{data.trend_profit?.backtest_comparison?.backtest_profit_auc?.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-border/30 pb-2 mt-2">
                        <span className="text-text-muted">Trend Model AUC</span>
                        <span className="font-mono">{data.trend_profit?.backtest_comparison?.backtest_trend_auc?.toFixed(3)}</span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-2">
                        {data.trend_profit?.backtest_comparison?.note}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </FadeIn>

        {/* 3. Expected Return Model Track Record */}
        <FadeIn delay={0.3}>
          <section className="bg-card border border-border rounded-2xl overflow-hidden glass shadow-soft">
            <div className="border-b border-border/40 p-5 bg-secondary/20">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BarChart className="w-5 h-5 text-accent" />
                Expected Return Calibration
              </h2>
            </div>
            <div className="p-6">
              {data.expected_return?.status === "insufficient_data" ? (
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm text-text-primary">{data.expected_return.caveat}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    {data.expected_return?.caveat && (
                      <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2 mb-4">
                        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        <p className="text-xs text-text-primary">{data.expected_return.caveat}</p>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-2">
                        Empirical Validation Distribution
                      </div>
                      <div className="space-y-3 p-4 border border-border/50 rounded-xl bg-secondary/5">
                        {Object.entries(data.expected_return?.realized_return_distribution?.empirical_quantiles || {}).map(([q, val]) => (
                          <div key={q} className="flex items-center justify-between text-sm">
                            <span className="text-text-muted capitalize w-24">
                              {q.replace("p", "Percentile ")}
                            </span>
                            <div className="flex-1 px-4">
                              <div className="h-2 bg-border rounded-full overflow-hidden relative">
                                {/* Visual dot for position from -5% to +5% range roughly */}
                                <div 
                                  className={cn(
                                    "absolute top-0 bottom-0 w-2 rounded-full",
                                    val > 0 ? "bg-success" : (val < 0 ? "bg-danger" : "bg-text-muted")
                                  )}
                                  style={{ left: `${Math.max(0, Math.min(100, (val + 5) * 10))}%` }}
                                />
                              </div>
                            </div>
                            <span className={cn("font-mono font-bold text-right w-16", val > 0 ? "text-success" : (val < 0 ? "text-danger" : "text-text-primary"))}>
                              {val > 0 ? "+" : ""}{val.toFixed(2)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-secondary/10 p-4 rounded-xl border border-border/50">
                    <h3 className="text-xs font-semibold text-text-secondary uppercase">Backtest Context</h3>
                    <div className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                      <span className="text-text-muted">Median Point R²</span>
                      <span className="font-mono">{data.expected_return?.backtest_comparison?.backtest_r2?.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                      <span className="text-text-muted">Band Calibration (10-90)</span>
                      <span className="font-mono">{data.expected_return?.backtest_comparison?.backtest_band_calibration?.toFixed(1)}%</span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-2 border-l-2 border-accent/30 pl-2">
                      {data.expected_return?.backtest_comparison?.note}
                    </p>
                    <p className="text-[10px] text-text-muted mt-2 border-l-2 border-warning/30 pl-2">
                      {data.expected_return?.data_limitation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
