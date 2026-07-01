"use client";

import React, { useState } from "react";
import { PageTransition } from "@/components/ui/Animate";
import { AIPromptInput } from "@/components/ui/Input";
import { ChatLayout } from "@/components/layouts";
import { Bot, User } from "lucide-react";

export default function AskPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Namaste! I am Quantara's AI swing trading co-pilot. I can evaluate NIFTY 50 setups, explain indicator values, or inspect your portfolio limits." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const triggerSend = () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      let response = "I have queried the vector index and model parameters. Standard EMA trends show support for this trade. Connect real FastAPI feeds to query live tickers.";
      
      if (userText.toLowerCase().includes("reliance")) {
        response = "RELIANCE is trading at ₹2,845.20. It has established support near ₹2,820. Indicators report a Bullish MACD crossover, suggesting a potential swing target of ₹2,950.";
      } else if (userText.toLowerCase().includes("portfolio")) {
        response = "Your portfolio cash balance is ₹3,78,215.15. The active holdings are RELIANCE, HDFCBANK, and TCS. Win rate is solid at 72.4%.";
      }

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setLoading(false);
    }, 1200);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-text-primary">Ask Quantara</h2>
          <p className="text-xs text-text-secondary">Consult the AI trading mentor regarding market directions</p>
        </div>

        {/* Chat Layout */}
        <ChatLayout
          chatHeader={
            <div className="p-4 border-b border-border/40 bg-secondary/15 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-xs flex items-center gap-1.5 text-text-primary">
                  Quantara AI Trading Mentor
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-success/20 text-success font-bold font-mono">
                    ONLINE
                  </span>
                </h4>
                <p className="text-[10px] text-text-secondary">Context bound to Indian NIFTY 50 securities</p>
              </div>
            </div>
          }
          messageStream={
            <>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    msg.role === "user" 
                      ? "bg-secondary/60 text-text-primary border-border" 
                      : "bg-accent/10 text-accent border-accent/25"
                  }`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-[20px] text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent text-white font-semibold rounded-tr-none shadow-sm"
                      : "bg-secondary/20 text-text-primary rounded-tl-none border border-border/40 shadow-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 max-w-[80%] animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/25 text-accent flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-secondary/20 border border-border/40 p-4 rounded-[20px] rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-secondary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-text-secondary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-text-secondary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </>
          }
          inputBar={
            <div className="p-4 border-t border-border/40 bg-secondary/10">
              <AIPromptInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about RELIANCE forecast or NIFTY 50 volume indicators..."
                onSend={triggerSend}
              />
            </div>
          }
        />
      </div>
    </PageTransition>
  );
}
