"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Brain,
  Clock,
  Info,
  AlertTriangle,
  ExternalLink,
  Activity,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types matching the actual /api/v1/predict response ──────────────────────

export interface AucCI {
  ci_lower: number | null;
  ci_upper: number | null;
  point_auc?: number | null;
  p_value_vs_random?: number | null;
  excludes_0_5?: boolean | null;
}

export interface RiskForecast {
  risk_level: "Low" | "Medium" | "High";
  risk_confidence: number;
  class_probabilities: { Low: number; Medium: number; High: number };
  model_accuracy: string;
  label_definition: string;
}

export interface TrendEvidence {
  bullish_probability: number;
  auc_confidence_interval: AucCI;
  interpretation: string;
}

export interface HistoricalAnalogSummary {
  median_return_pct: number;
  hit_rate_pct: number;
  ci_lower_median: number;
  ci_upper_median: number;
  ci_lower_hit_rate: number;
  ci_upper_hit_rate: number;
  n_analogs: number;
  caveat: string;
}

export interface HistoricalContext {
  base_win_rate_pct: number;
  profit_probability: number;
  expected_return_band_pct: { lower_10th: number; median: number; upper_90th: number };
  return_model_caveat: string;
  historical_analogs?: {
    summary: HistoricalAnalogSummary;
    symbol: string;
    analogs?: { rank: number; date: string; distance: number; forward_return_5d_pct: number }[];
  } | null;
}

export interface ModelCIs {
  trend_auc_ci: [number | null, number | null];
  profit_auc_ci: [number | null, number | null];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const riskColors = {
  Low: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    glow: "shadow-emerald-500/10",
    bar: "bg-emerald-500",
    dot: "bg-emerald-400",
  },
  Medium: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    glow: "shadow-amber-500/10",
    bar: "bg-amber-500",
    dot: "bg-amber-400",
  },
  High: {
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
    glow: "shadow-rose-500/10",
    bar: "bg-rose-500",
    dot: "bg-rose-400",
  },
};

function CIBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/40 border border-border/50 text-[9px] font-mono text-text-secondary">
      {label}: <span className="text-text-primary font-bold">{value}</span>
    </span>
  );
}

function CaveatBox({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-[10px] text-text-secondary leading-relaxed">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );
}

// ─── 1. RiskForecastCard (HEADLINE — most prominent) ────────────────────────

export function RiskForecastCard({ risk }: { risk: RiskForecast }) {
  const cfg = riskColors[risk.risk_level] ?? riskColors.Medium;
  const confPct = Math.round(risk.risk_confidence * 100);

  const classProbs = [
    { label: "Low", val: risk.class_probabilities?.Low ?? 0, color: "bg-emerald-500" },
    { label: "Medium", val: risk.class_probabilities?.Medium ?? 0, color: "bg-amber-500" },
    { label: "High", val: risk.class_probabilities?.High ?? 0, color: "bg-rose-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 glass shadow-soft",
        cfg.bg, cfg.border
      )}
    >
      {/* Ambient glow */}
      <div className={cn("absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20", cfg.bg)} />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={cn("p-2 rounded-xl border", cfg.bg, cfg.border)}>
              <ShieldCheck className={cn("w-4 h-4", cfg.text)} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                Risk Forecast <span className="text-accent">← Primary Signal</span>
              </span>
              <p className="text-[9px] text-text-secondary/70 mt-0.5">
                Only statistically validated model (45.9% vs 33.3% random)
              </p>
            </div>
          </div>
          {/* Risk Badge */}
          <div className={cn(
            "flex flex-col items-center px-4 py-2 rounded-xl border shrink-0",
            cfg.bg, cfg.border
          )}>
            <span className={cn("text-2xl font-black tracking-tight", cfg.text)}>
              {risk.risk_level.toUpperCase()}
            </span>
            <span className="text-[9px] text-text-secondary font-semibold uppercase tracking-wider">Risk</span>
          </div>
        </div>

        {/* Confidence */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-text-secondary font-semibold">Model Confidence</span>
            <span className="font-mono font-bold text-text-primary">{confPct}%</span>
          </div>
          <div className="h-1.5 bg-border/60 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", cfg.bar)}
              initial={{ width: 0 }}
              animate={{ width: `${confPct}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Class Probabilities */}
        <div className="space-y-2">
          <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
            Class Probabilities
          </span>
          {classProbs.map((cp) => (
            <div key={cp.label} className="flex items-center gap-2 text-[10px]">
              <span className="w-12 text-text-secondary font-medium">{cp.label}</span>
              <div className="flex-1 h-1 bg-border/50 rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", cp.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(cp.val * 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className="font-mono text-text-primary w-9 text-right font-bold">
                {Math.round(cp.val * 100)}%
              </span>
            </div>
          ))}
        </div>

        {/* Model accuracy context */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/20 border border-border/30 text-[10px] text-text-secondary">
          <Info className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary">Accuracy: </span>
            {risk.model_accuracy}
            {" · "}
            <span className="italic">
              {risk.label_definition}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── 2. HistoricalContextCard ────────────────────────────────────────────────

export function HistoricalContextCard({ ctx }: { ctx: HistoricalContext }) {
  const band = ctx.expected_return_band_pct;
  const analogs = ctx.historical_analogs;
  const summary = analogs?.summary;
  const medianPositive = (band?.median ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border bg-card p-5 glass shadow-soft space-y-5"
    >
      <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <Clock className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
            Historical Context
          </span>
          <h3 className="text-sm font-bold text-text-primary">
            Analog Setups &amp; Return Bands
          </h3>
        </div>
      </div>

      {/* Return Band */}
      <div>
        <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block mb-2">
          5-Day Return Uncertainty Band (10th–90th pct)
        </span>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={cn("text-xl font-mono font-black",
            medianPositive ? "text-emerald-400" : "text-rose-400"
          )}>
            {medianPositive ? "+" : ""}{band?.median?.toFixed(2)}%
          </span>
          <span className="text-xs text-text-secondary font-mono">
            [{band?.lower_10th?.toFixed(1)}%, {band?.upper_90th?.toFixed(1)}%]
          </span>
          <span className="text-[9px] text-text-secondary/70">median estimate</span>
        </div>
        <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-amber-400/80">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>{ctx.return_model_caveat}</span>
        </div>
      </div>

      {/* Profit probability + base rate */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-secondary/10 border border-border/40">
          <span className="text-[9px] text-text-secondary uppercase tracking-wider font-bold block">
            Profit Probability
          </span>
          <span className="text-lg font-mono font-black text-text-primary mt-0.5 block">
            {Math.round((ctx.profit_probability ?? 0) * 100)}%
          </span>
          <span className="text-[9px] text-text-secondary/70">
            Base win rate: {ctx.base_win_rate_pct?.toFixed(1)}%
          </span>
        </div>

        {summary ? (
          <div className="p-3 rounded-xl bg-secondary/10 border border-border/40">
            <span className="text-[9px] text-text-secondary uppercase tracking-wider font-bold block">
              Analog Hit Rate
            </span>
            <span className="text-lg font-mono font-black text-text-primary mt-0.5 block">
              {summary.hit_rate_pct?.toFixed(0)}%
            </span>
            <span className="text-[9px] text-text-secondary font-mono">
              95% CI [{summary.ci_lower_hit_rate?.toFixed(1)}, {summary.ci_upper_hit_rate?.toFixed(1)}]
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-secondary/10 border border-border/40 flex items-center justify-center text-[10px] text-text-secondary/60">
            No analog data
          </div>
        )}
      </div>

      {/* Historical Analogs details */}
      {summary && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-text-secondary uppercase tracking-wider">
              Historical Analogs ({summary.n_analogs} setups)
            </span>
            <span className="font-mono text-text-secondary">
              Median: <span className={cn("font-bold", summary.median_return_pct >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {summary.median_return_pct >= 0 ? "+" : ""}{summary.median_return_pct?.toFixed(2)}%
              </span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <CIBadge
              label="Median return 95% CI"
              value={`[${summary.ci_lower_median?.toFixed(1)}%, ${summary.ci_upper_median?.toFixed(1)}%]`}
            />
            <CIBadge label="N" value={`${summary.n_analogs} analogs`} />
          </div>
          <CaveatBox text={summary.caveat} />
        </div>
      )}
    </motion.div>
  );
}

// ─── 3. SHAPExplanationCard ───────────────────────────────────────────────────

export function SHAPExplanationCard({
  symbol,
  rationales,
  modelSources,
}: {
  symbol: string;
  rationales: string[];
  modelSources: Record<string, string>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-border bg-card p-5 glass shadow-soft relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
              SHAP Explainability
            </span>
            <h3 className="text-sm font-bold text-text-primary">
              Feature Drivers for {symbol}
            </h3>
          </div>
        </div>

        {/* Rationale list */}
        {rationales.length === 0 ? (
          <div className="p-4 bg-accent/5 border border-accent/15 rounded-xl text-[10px] text-text-secondary text-center">
            No SHAP rationales available for this symbol.
          </div>
        ) : (
          <div className="space-y-2">
            {rationales.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary/10 border border-border/30"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                <span className="text-xs text-text-primary leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* Source attribution */}
        <div className="pt-2 border-t border-border/30 space-y-2">
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
            Live Ensemble Sources
          </span>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(modelSources).map((src, i) => (
              <span
                key={i}
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-accent/5 border border-border/40 text-text-primary"
              >
                ✓ {src.split(" - ")[0]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── 4. TrendEvidenceCard (DE-EMPHASIZED) ───────────────────────────────────

export function TrendEvidenceCard({
  trend,
  modelCIs,
}: {
  trend: TrendEvidence;
  modelCIs: ModelCIs;
}) {
  const bullPct = Math.round((trend.bullish_probability ?? 0.5) * 100);
  const ci = trend.auc_confidence_interval;
  const trendCI = modelCIs?.trend_auc_ci ?? [null, null];

  const leanColor =
    bullPct >= 55
      ? "text-emerald-400"
      : bullPct <= 45
      ? "text-rose-400"
      : "text-text-secondary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border/60 bg-card/60 p-5 space-y-4"
    >
      {/* Header — de-emphasized */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-text-secondary/60" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
              Trend Signal <span className="text-text-secondary/40">(weak — near-random)</span>
            </span>
          </div>
        </div>
        <Link
          href="/track-record"
          className="flex items-center gap-1 text-[9px] text-accent hover:underline bg-accent/5 px-2 py-1 rounded border border-accent/20"
        >
          Track Record <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      </div>

      {/* Bullish probability bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline text-[10px]">
          <span className="text-text-secondary/70 font-medium">Bullish Probability</span>
          <span className={cn("font-mono font-black text-base", leanColor)}>
            {bullPct}%
          </span>
        </div>
        <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", bullPct >= 50 ? "bg-emerald-500/60" : "bg-rose-500/60")}
            initial={{ width: 0 }}
            animate={{ width: `${bullPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <p className="text-[9px] text-text-secondary/60 italic">{trend.interpretation}</p>
      </div>

      {/* AUC CI — shown inline, not hidden */}
      <div className="space-y-1.5">
        <span className="text-[9px] font-bold text-text-secondary/60 uppercase tracking-wider block">
          Bootstrapped AUC Confidence Interval (1000 resamples)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {ci?.point_auc != null && (
            <CIBadge label="AUC" value={ci.point_auc.toFixed(3)} />
          )}
          {trendCI[0] != null && trendCI[1] != null && (
            <CIBadge
              label="95% CI"
              value={`[${trendCI[0]!.toFixed(3)}, ${trendCI[1]!.toFixed(3)}]`}
            />
          )}
          {ci?.p_value_vs_random != null && (
            <CIBadge label="p vs 0.5" value={ci.p_value_vs_random.toFixed(4)} />
          )}
        </div>
        <p className="text-[9px] text-text-secondary/50 leading-relaxed">
          An AUC near 0.5 means the trend signal is indistinguishable from random guessing.
          The interval above shows the range of uncertainty — do not treat it as a reliable signal.
        </p>
      </div>
    </motion.div>
  );
}
