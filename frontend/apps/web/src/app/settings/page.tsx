"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { User, Shield, CreditCard, Code, Moon, Sun, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyApiKey = () => {
    navigator.clipboard.writeText("qt_live_51Px820F9xJn9902qQp11");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold">Account Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your credentials, layout settings, and developer keys</p>
      </div>

      {/* Grid Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar inside Settings */}
        <div className="space-y-1">
          <button className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-secondary/80 text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> General Profile
          </button>
          <button className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/45 hover:text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" /> Security & Access
          </button>
          <button className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/45 hover:text-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Billing Plans
          </button>
          <button className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/45 hover:text-foreground flex items-center gap-2">
            <Code className="w-4 h-4" /> API Credentials
          </button>
        </div>

        {/* Content Box */}
        <div className="md:col-span-2 space-y-6">
          {/* General Preferences */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="font-bold border-b border-border pb-3">Interface Theme</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Dark Mode Default</div>
                <div className="text-xs text-muted-foreground">Toggle application theme preference</div>
              </div>
              {mounted ? (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-4 h-4 text-yellow-500" />
                      Switch to Light
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-500" />
                      Switch to Dark
                    </>
                  )}
                </button>
              ) : (
                <div className="w-24 h-9 bg-secondary animate-pulse rounded-xl" />
              )}
            </div>
          </div>

          {/* API Keys */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="font-bold border-b border-border pb-3">Developer Credentials</h3>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">API Live Key</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value="qt_live_51Px820F9xJn9902qQp11"
                  className="flex-1 bg-secondary font-mono text-xs text-muted-foreground border border-border rounded-xl px-3 py-2 outline-none"
                />
                <button
                  onClick={copyApiKey}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold cursor-pointer hover:bg-primary/95 flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    "Copy"
                  )}
                </button>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Live keys allow requests to be routed from the dashboard framework.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
