"use client";

import React, { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/Animate";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { User, Shield, CreditCard, Code, Moon, Sun, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyKey = () => {
    navigator.clipboard.writeText("qt_live_nifty50_demo_51Px820F");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="font-heading text-text-primary">System Settings</h2>
          <p className="text-xs text-text-secondary">Configure credentials, interfaces, and developer sandbox keys</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Navigation options */}
          <div className="space-y-1 bg-card/40 border border-border p-2 rounded-[20px] glass">
            <button className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold bg-secondary/40 text-text-primary flex items-center gap-2">
              <User className="w-4 h-4 text-accent" /> Account Info
            </button>
            <button className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:bg-secondary/20 hover:text-text-primary flex items-center gap-2 transition-colors">
              <Shield className="w-4 h-4" /> Credentials
            </button>
            <button className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:bg-secondary/20 hover:text-text-primary flex items-center gap-2 transition-colors">
              <CreditCard className="w-4 h-4" /> Subscriptions
            </button>
            <button className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:bg-secondary/20 hover:text-text-primary flex items-center gap-2 transition-colors">
              <Code className="w-4 h-4" /> API Keys
            </button>
          </div>

          {/* Form details block */}
          <div className="md:col-span-2 space-y-6">
            {/* Preferences */}
            <div className="p-6 rounded-[20px] bg-card border border-border space-y-4 glass shadow-soft">
              <h3 className="font-bold text-sm text-text-primary border-b border-border/40 pb-3">Preferences</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-text-primary">Dark Mode Theme</div>
                  <div className="text-[10px] text-text-secondary">Toggle dashboard display styling</div>
                </div>
                {mounted ? (
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="px-4 py-2 rounded-xl bg-secondary/60 hover:bg-secondary/90 border border-border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="w-3.5 h-3.5 text-yellow-500" />
                        Switch Light
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5 text-indigo-600" />
                        Switch Dark
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-24 h-8 bg-secondary animate-pulse rounded-xl" />
                )}
              </div>
            </div>

            {/* Sandbox Key */}
            <div className="p-6 rounded-[20px] bg-card border border-border space-y-4 glass shadow-soft">
              <h3 className="font-bold text-sm text-text-primary border-b border-border/40 pb-3">Developer Sandbox</h3>
              <div className="space-y-2">
                <label className="text-[10px] text-text-secondary font-bold uppercase">Sandbox API Live Key</label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value="qt_live_nifty50_demo_51Px820F"
                    className="font-mono text-xs text-text-secondary/80 bg-secondary/40 select-all"
                  />
                  <Button
                    onClick={copyKey}
                    variant={copied ? "secondary" : "primary"}
                    className="shrink-0"
                  >
                    {copied ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-success" />
                        Copied
                      </span>
                    ) : (
                      "Copy"
                    )}
                  </Button>
                </div>
                <span className="text-[9px] text-text-secondary block">
                  This mock key authenticates local layout interactions.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
