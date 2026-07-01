"use client";

import { useState } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";

export default function AskPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am Quantara's AI financial intelligence assistant. Ask me about stock forecasts, sentiment analysis, or current portfolio status." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      let reply = "I've analyzed that ticker using our standard quantitative model. Based on moving averages, there's a strong support level. Please integrate the real FastAPI services to fetch actual sentiment data.";
      if (userMsg.toLowerCase().includes("aapl")) {
        reply = "Apple Inc. (AAPL) is trading robustly with a bullish pattern. The current support is around $180, and resistance lies at $187. Our ML forecast model predicts a 2.4% gain over the next 5 days.";
      } else if (userMsg.toLowerCase().includes("portfolio")) {
        reply = "Your portfolio value is currently $124,592.15, dominated by NVIDIA Corp. (NVDA) at 17.5%. The portfolio is up 12.4% this quarter.";
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto border border-border bg-card rounded-2xl overflow-hidden">
      {/* Bot Chat Header */}
      <div className="p-4 border-b border-border bg-secondary/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            Quantara Advisor
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono font-medium flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              ONLINE
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">Ask anything about markets or holdings</p>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              msg.role === "user" 
                ? "bg-secondary text-foreground border-border" 
                : "bg-primary/10 text-primary border-primary/20"
            }`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground font-medium rounded-tr-none"
                : "bg-secondary/40 text-foreground rounded-tl-none border border-border/60"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-secondary/40 border border-border/60 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Form Footer */}
      <form onSubmit={sendMessage} className="p-4 border-t border-border bg-secondary/15 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask apple's forecast or summary of portfolio..."
          className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary placeholder-muted-foreground"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
