"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageTransition } from "@/components/ui/Animate";
import { DashboardLayout } from "@/components/layouts";
import { Bot, User, Send, Sparkles, Brain, Landmark, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Custom widgets we built
import { AIResponseCard } from "@/components/ask/AIResponseCard";
import { PortfolioAssistantCard } from "@/components/ask/PortfolioAssistantCard";
import { EducationCard } from "@/components/ask/EducationCard";
import { ComparisonCard } from "@/components/ask/ComparisonCard";
import { TradeCoachCard } from "@/components/ask/TradeCoachCard";
import { MemoryPanel, MemoryData } from "@/components/ask/MemoryPanel";
import { DailyBriefing } from "@/components/ask/DailyBriefing";
import { AIStatusPanel } from "@/components/ask/AIStatusPanel";
import { TrustPanel } from "@/components/ask/TrustPanel";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  widget?: "stock" | "portfolio" | "education" | "comparison" | "coach";
  widgetData?: any;
}

export default function AskPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial",
      role: "assistant",
      content: "Good morning, Krishna. I am Quantara's AI Trading Mentor. Ask me any trade setups evaluation, indicators breakdowns, or portfolio safety checkups today."
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Memory Panel State
  const [memory, setMemory] = useState<MemoryData>({
    riskTolerance: "Medium",
    capital: 50000,
    holdingPeriod: 7,
    preferredSectors: ["Banking", "IT"],
    tradingStyle: "Swing"
  });

  // Daily Briefing state
  const recommendedTrades = [
    { rank: 1, ticker: "RELIANCE", confidence: 84, expectedReturn: "+6.1%", risk: "Medium" as const },
    { rank: 2, ticker: "TCS", confidence: 78, expectedReturn: "+4.8%", risk: "Low" as const },
    { rank: 3, ticker: "HDFCBANK", confidence: 82, expectedReturn: "+5.5%", risk: "Low" as const }
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const presetPrompts = [
    "Should I buy Reliance?",
    "Build me a ₹50,000 portfolio.",
    "Compare Reliance and TCS.",
    "Explain RSI.",
    "Analyze my portfolio.",
    "Find low-risk opportunities.",
    "What should I do today?"
  ];

  const handleUpdateMemory = (updated: MemoryData) => {
    setMemory(updated);
  };

  const handleTriggerSend = (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: text.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // AI logic trigger simulation
    setTimeout(() => {
      let content = "";
      let widget: "stock" | "portfolio" | "education" | "comparison" | "coach" | undefined;
      let widgetData: any;

      const q = text.toLowerCase();

      if (q.includes("buy reliance") || q.includes("should i buy")) {
        content = "Here is the quantitative scan report for RELIANCE. All momentum indicators support entry at the current support floor.";
        widget = "stock";
        widgetData = {
          ticker: "RELIANCE",
          signal: "BUY",
          confidence: 84,
          profitProbability: 72,
          expectedReturn: "+6.1%",
          risk: "Medium",
          rationales: [
            { id: "1", title: "Technical Breakout", shortDesc: "Broke key 50-day EMA horizontal resistance.", explanation: "Daily candles closed cleanly above the ₹2,820 resistance ceiling, opening up immediate paths to ₹2,990 targets." },
            { id: "2", title: "Institutional Accumulation", shortDesc: "Active FII net buying detected.", explanation: "Derivative block trading volumes suggest major institutions are expanding position sizes at current ranges." }
          ]
        };
      } else if (q.includes("portfolio")) {
        content = "I have run the diagnostic engine on your current swing holdings. Here are your portfolio metrics:";
        widget = "portfolio";
        widgetData = {
          strengths: ["Highly diversified sectors", "Favorable risk-to-reward ratios"],
          weaknesses: ["Heavy concentration in Banking limits options", "Low cash reserves for dynamic entries"],
          recommendations: ["Reduce HDFC Bank allocation slightly", "Add Defensive sectors like FMCG (ITC)"]
        };
      } else if (q.includes("rsi") || q.includes("explain")) {
        content = "RSI (Relative Strength Index) is a momentum oscillator. Let me break down the concepts:";
        widget = "education";
        widgetData = {
          topicName: "RSI Indicator",
          definition: "RSI gauges whether a security is overbought (price rose too fast, due for pullbacks) or oversold (price fell too fast, due for technical rebounds) on a 0 to 100 scale.",
          gaugeValue: 72,
          gaugeLabel: "Overbought Zone",
          learningSteps: [
            "Identify RSI ranges (above 70 is overbought, below 30 is oversold)",
            "Wait for momentum confirmations rather than entering immediately",
            "Combine RSI with volumes metrics for accurate swing triggers"
          ]
        };
      } else if (q.includes("compare") || q.includes("tcs")) {
        content = "Here is a side-by-side opportunities scan comparing RELIANCE and TCS:";
        widget = "comparison";
        widgetData = {
          assetA: { ticker: "RELIANCE", signal: "BUY", confidence: 84, expectedReturn: "+6.1%", risk: "Medium" },
          assetB: { ticker: "TCS", signal: "BUY", confidence: 78, expectedReturn: "+4.8%", risk: "Low" },
          recommendationText: "Quantara recommends favoring RELIANCE due to higher momentum indicators, but TCS remains an outstanding lower-volatility defensive choice."
        };
      } else if (q.includes("hold") || q.includes("exit") || q.includes("enter") || q.includes("book")) {
        content = "I have analyzed your request based on your current holding limits and swing parameters:";
        widget = "coach";
        widgetData = {
          action: "HOLD POSITION",
          reasoning: "Your position in HDFC Bank is currently in a minor consolidation pull back. Major support at ₹1,590 holds firmly. Exit triggers are not violated.",
          risk: "Low",
          expectedOutcome: "Technical rebound from EMA bounds"
        };
      } else {
        content = `Based on your preference for Banking and IT sectors, I recommend monitoring TCS and HDFC BANK. Both maintain low volatility setups ideal for swing trades up to ${memory.holdingPeriod} days.`;
      }

      // Stream character by character simulation
      let streamedLength = 0;
      const targetText = content;
      const streamingMsgId = Math.random().toString();

      setIsTyping(false);
      
      // Initialize message with empty text
      setMessages((prev) => [
        ...prev,
        { id: streamingMsgId, role: "assistant", content: "" }
      ]);

      const streamTimer = setInterval(() => {
        streamedLength += 4; // print 4 chars at a time
        if (streamedLength >= targetText.length) {
          clearInterval(streamTimer);
          // Set final complete message along with the widget
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMsgId
                ? { ...m, content: targetText, widget, widgetData }
                : m
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMsgId
                ? { ...m, content: targetText.substring(0, streamedLength) }
                : m
            )
          );
        }
      }, 30);

    }, 1500);
  };

  const handleSelectTrade = (ticker: string) => {
    handleTriggerSend(`Should I buy ${ticker}?`);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <h2 className="font-heading text-text-primary text-2xl md:text-3xl font-extrabold tracking-tight">
              Ask Quantara AI
            </h2>
            <p className="text-xs md:text-sm text-text-secondary mt-1 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              Your personal hedge fund mentor and portfolio coach.
            </p>
          </div>
        </div>

        {/* Dashboard Split Layout */}
        <DashboardLayout
          sidebar={
            <>
              {/* Daily Briefing Bulletin */}
              <DailyBriefing 
                marketOutlook="Bullish" 
                recommendedTrades={recommendedTrades} 
                onSelectTrade={handleSelectTrade}
              />

              {/* Memory Settings Panel */}
              <MemoryPanel memory={memory} onUpdateMemory={handleUpdateMemory} />

              {/* Node status Monitor */}
              <AIStatusPanel />

              {/* Freshness & Risk warning Trust panel */}
              <TrustPanel />
            </>
          }
        >
          {/* Left Main Chat Feed Wrapper */}
          <div className="flex flex-col h-[600px] border border-border bg-card/60 rounded-[24px] overflow-hidden glass relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

            {/* Chat header banner */}
            <div className="p-4 border-b border-border/40 bg-secondary/15 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-xs flex items-center gap-1.5 text-text-primary">
                  Quantara Trading Co-Pilot
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </h4>
                <p className="text-[10px] text-text-secondary">Tuned to swing limits: ₹{memory.capital.toLocaleString()} | {memory.riskTolerance} Risk</p>
              </div>
            </div>

            {/* Message lists Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs">
              
              {/* Welcome Screen (Only shows if there's only initial message) */}
              {messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center space-y-6 max-w-md mx-auto"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-accent shadow-sm border border-accent/20">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-text-primary tracking-tight">Good morning, Krishna.</h3>
                    <p className="text-text-secondary text-xs">What would you like to know today?</p>
                  </div>

                  {/* suggested preset Prompt Chips */}
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    {presetPrompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => handleTriggerSend(p)}
                        className="px-3.5 py-1.5 rounded-full border border-border hover:border-accent/40 bg-secondary/10 hover:bg-secondary/40 text-[10px] text-text-secondary hover:text-text-primary transition-all cursor-pointer font-medium select-none"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Chat bubbles */}
              {messages.length > 1 && (
                <div className="space-y-4">
                  {messages.map((m) => (
                    <div key={m.id} className="space-y-2">
                      <div className={cn("flex gap-2.5 max-w-[85%] items-start", m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}>
                        {m.role === "assistant" ? (
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-accent to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Brain className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-text-secondary shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className={cn("p-3.5 rounded-2xl border leading-relaxed font-body shadow-sm",
                          m.role === "user" 
                            ? "bg-accent/15 border-accent/20 text-text-primary rounded-tr-none" 
                            : "bg-secondary/40 border-border/40 text-text-primary/95 rounded-tl-none"
                        )}>
                          {m.content}
                        </div>
                      </div>

                      {/* Render custom widget helpers inline */}
                      {m.role === "assistant" && m.widget && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="pl-9 pr-4"
                        >
                          {m.widget === "stock" && <AIResponseCard {...m.widgetData} />}
                          {m.widget === "portfolio" && <PortfolioAssistantCard {...m.widgetData} />}
                          {m.widget === "education" && <EducationCard {...m.widgetData} />}
                          {m.widget === "comparison" && <ComparisonCard {...m.widgetData} />}
                          {m.widget === "coach" && <TradeCoachCard {...m.widgetData} />}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2.5 items-center mr-auto">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-accent to-purple-600 text-white flex items-center justify-center shrink-0">
                    <Brain className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="bg-secondary/40 border border-border/40 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-text-secondary/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-text-secondary/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-text-secondary/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={feedEndRef} />
            </div>

            {/* Bottom input form */}
            <div className="p-4 border-t border-border/40 bg-secondary/15 shrink-0 space-y-2">
              {/* If chat has messages, display quick suggestion follow-ups at bottom */}
              {messages.length > 1 && !isTyping && (
                <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
                  {[
                    "Why is this setup bullish?",
                    "What stop loss boundaries apply?",
                    "Show similar pattern ideas",
                    "Explain RSI calculation steps"
                  ].map((f) => (
                    <button
                      key={f}
                      onClick={() => handleTriggerSend(f)}
                      className="px-2.5 py-1 rounded-full border border-border hover:border-accent/40 bg-secondary/40 hover:bg-secondary/60 text-[9px] font-semibold text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTriggerSend(input);
                }}
                className="relative flex items-center bg-card border border-border rounded-xl group focus-within:border-accent/50 focus-within:shadow-[0_0_12px_rgba(59,130,246,0.15)] transition-all"
              >
                <input
                  type="text"
                  placeholder="Ask follow-up questions, eval trades, explain indicators..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-transparent pl-4 pr-12 py-3 text-xs md:text-sm text-text-primary outline-none placeholder-text-secondary/50 font-sans"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-text-secondary hover:text-accent transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </DashboardLayout>
      </div>
    </PageTransition>
  );
}
