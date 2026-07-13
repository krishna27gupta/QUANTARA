"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Sparkles, User, Brain, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export interface AskQuantaraPanelProps {
  currentTicker: string;
  sectorName?: string;
  onCompareRequest?: (tickerA: string, tickerB: string) => void;
}

export function AskQuantaraPanel({ currentTicker, sectorName = "Banking", onCompareRequest }: AskQuantaraPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `Hello! I have generated the daily **${currentTicker}** quantitative validation score. Based on ensembled calculations:

✓ **Relative Strength**: +4.2%  
✓ **MACD**: Bullish Crossover  
✓ **Volume Inflows**: +37% (vs 20-day average)  
✓ **Sector Momentum**: Strong Bullish  
✓ **Institutional Flows**: Positive (FII accumulation)  

**Model Confidence**: **High** [Source Citation: Ensemble Model Output #${currentTicker}-2026]`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const presetQuestions = [
    `Should I buy ${currentTicker}?`,
    `Why is ${currentTicker} bullish?`,
    `Compare ${currentTicker} and TCS`,
    `Explain RSI`
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulated AI response streaming delay
    setTimeout(() => {
      let responseText = "";
      const query = text.toLowerCase();

      if (query.includes("should i buy")) {
        responseText = `Quantara's indicators flag a strong entry signal for ${currentTicker}. The setup reports an expected positive return and a high confidence score, supported by positive MACD crossovers and rising daily volumes. However, ensure the stop loss at optimal boundaries is adhered to.`;
      } else if (query.includes("why is") || query.includes("bullish")) {
        responseText = `${currentTicker} is displaying bullish behavior due to three key factors: (1) Strong institutional inflows over the past 48 hours, (2) MACD showing a golden cross on the daily timeframe, and (3) Sector strength in ${sectorName} leading index momentum.`;
      } else if (query.includes("compare")) {
        responseText = `Comparing ${currentTicker} vs TCS: ${currentTicker} is reporting higher expected swing momentum (+6.1% vs +4.8% for TCS) but has slightly higher volatility characteristics. Favor ${currentTicker} for faster short-term payouts, or TCS for lower-risk stable consolidation.`;
        if (onCompareRequest) {
          onCompareRequest(currentTicker, "TCS");
        }
      } else if (query.includes("rsi")) {
        responseText = `RSI stands for Relative Strength Index. It is a momentum oscillator ranging from 0 to 100. Generally, values above 70 indicate that a stock is overbought (potentially overvalued/due for pullback), while values below 30 indicate it is oversold (potentially undervalued/rebound setup).`;
      } else {
        responseText = `Based on current scanner logs, ${currentTicker} remains in a high-conviction setup. Technical indicators show neutral-to-bullish momentum, making it suitable for swing traders aiming for 5–7 day holding targets.`;
      }

      const aiMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "ai",
        text: responseText,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
      let content: React.ReactNode = line;
      if (line.trim().startsWith('✓')) {
        const remaining = line.replace('✓', '').trim();
        content = (
          <span key={i} className="flex items-center gap-1.5 text-emerald-400 font-semibold my-0.5">
            <span className="text-emerald-500 font-bold">✓</span>
            {remaining}
          </span>
        );
      } else {
        const parts = line.split('**');
        if (parts.length > 1) {
          content = parts.map((part, index) => index % 2 === 1 ? <strong key={index} className="text-text-primary font-semibold">{part}</strong> : part);
        }
      }
      return <div key={i}>{content}</div>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="p-6 rounded-[24px] border border-border bg-card glass shadow-soft hover:border-accent/30 transition-colors duration-300 flex flex-col h-[400px] relative"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="p-2 rounded-xl bg-accent/15 text-accent border border-accent/25">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <span className="font-caption text-[10px] text-text-secondary uppercase tracking-wider block">Co-Pilot Assistant</span>
          <h3 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
            Ask Quantara AI
            <span className="text-[9px] bg-accent/10 text-accent font-bold px-1.5 py-0.5 rounded-full">Pro</span>
          </h3>
        </div>
      </div>

      {/* Chat messages feed */}
      <div className="flex-1 overflow-y-auto space-y-3.5 my-3 pr-1 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex gap-2.5 max-w-[85%] items-start",
              m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {m.sender === "ai" ? (
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-accent to-purple-600 text-white flex items-center justify-center shrink-0">
                <Brain className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="h-7 w-7 rounded-lg bg-secondary/80 border border-border flex items-center justify-center text-text-secondary shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={cn(
                "p-3 rounded-2xl border leading-relaxed font-body",
                m.sender === "user"
                  ? "bg-accent/10 border-accent/20 text-text-primary"
                  : "bg-secondary/40 border-border/40 text-text-primary/95"
              )}
            >
              {renderMessageText(m.text)}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2.5 items-center mr-auto">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-accent to-purple-600 text-white flex items-center justify-center shrink-0">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <div className="bg-secondary/40 border border-border/40 p-3 rounded-2xl flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-text-secondary/70 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-text-secondary/70 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-text-secondary/70 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Suggested Chips (preset Qs) */}
      <div className="flex flex-wrap gap-1.5 py-2 border-t border-border/30 overflow-x-auto whitespace-nowrap scrollbar-none">
        {presetQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="px-3 py-1 rounded-full border border-border hover:border-accent/40 bg-secondary/20 hover:bg-secondary/40 text-[10px] text-text-secondary hover:text-text-primary transition-all cursor-pointer select-none"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="relative mt-1 border border-border rounded-xl bg-secondary/10 group focus-within:border-accent/40 transition-colors"
      >
        <input
          type="text"
          placeholder="Ask AI follow-up trade logic..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-transparent pl-4 pr-12 py-2.5 text-xs text-text-primary outline-none placeholder-text-secondary/50"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-secondary hover:text-accent transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </motion.div>
  );
}

export default AskQuantaraPanel;
