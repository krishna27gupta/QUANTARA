"use client";

import { useState } from "react";
import { Play, Sparkles, BarChart, FileText, CheckCircle2 } from "lucide-react";

interface Metric {
  name: string;
  value: string;
}

interface AnalysisResult {
  ticker: string;
  sentiment: string;
  score: string;
  summary: string;
  metrics: Metric[];
}

export default function AnalyzePage() {
  const [ticker, setTicker] = useState("AAPL");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const triggerAnalysis = () => {
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        ticker: ticker.toUpperCase(),
        sentiment: "Bullish",
        score: "85/100",
        summary: `Quantitative analysis of ${ticker.toUpperCase()} suggests a strong upward momentum based on exponential moving averages and relative strength index (RSI 62).`,
        metrics: [
          { name: "P/E Ratio", value: "28.4" },
          { name: "Debt to Equity", value: "1.2" },
          { name: "RSI (14d)", value: "62.4" },
          { name: "MACD Signal", value: "Buy" },
        ],
      });
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold">Quantitative Stock Analyzer</h2>
        <p className="text-sm text-muted-foreground">Run mathematical and sentiment indicators on any stock or crypto</p>
      </div>

      {/* Analysis Control Box */}
      <div className="p-6 rounded-2xl bg-card border border-border flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Enter Ticker / Symbol</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:border-primary text-foreground text-sm font-mono"
            placeholder="e.g. AAPL, BTC, NVDA"
          />
        </div>
        <button
          onClick={triggerAnalysis}
          disabled={analyzing}
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/95 disabled:opacity-50 cursor-pointer select-none transition-colors"
        >
          {analyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Analysis
            </>
          )}
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border">
              <div className="text-xs text-muted-foreground font-semibold mb-2">TARGET ASSET</div>
              <div className="text-2xl font-bold font-mono">{result.ticker}</div>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <div className="text-xs text-muted-foreground font-semibold mb-2">QUANT SENTIMENT</div>
              <div className="text-2xl font-bold text-emerald-500 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {result.sentiment}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <div className="text-xs text-muted-foreground font-semibold mb-2">PROBABILITY SCORE</div>
              <div className="text-2xl font-bold font-mono text-primary">{result.score}</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="font-bold flex items-center gap-2 border-b border-border pb-3">
              <FileText className="w-4 h-4 text-primary" />
              Executive Summary
            </h3>
            <p className="text-sm text-foreground/90 leading-relaxed">{result.summary}</p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="font-bold flex items-center gap-2 border-b border-border pb-3">
              <BarChart className="w-4 h-4 text-primary" />
              Technical Indicators
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {result.metrics.map((metric: Metric, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-secondary/30 border border-border/80">
                  <span className="text-xs text-muted-foreground font-medium block mb-1">{metric.name}</span>
                  <span className="font-mono font-bold text-base text-foreground">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && !analyzing && (
        <div className="p-12 rounded-2xl bg-secondary/10 border border-border border-dashed text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto" />
          <h4 className="font-semibold">Ready for calculations</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Input a stock symbol above and click Run Analysis. Predictions use mock analytics nodes.
          </p>
        </div>
      )}
    </div>
  );
}
