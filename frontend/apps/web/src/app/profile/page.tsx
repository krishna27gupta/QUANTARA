"use client";

import { useAuth } from "@/context/AuthContext";
import { Mail, Award, Target, Landmark, Percent } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const stats = [
    { label: "Win Rate", value: "68.4%", icon: Percent, color: "text-emerald-500" },
    { label: "Total Mock Trades", value: "142 Runs", icon: Target, color: "text-primary" },
    { label: "Paper Trade Account", value: "₹5,00,000", icon: Landmark, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold">User Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your personal trading stats, account status, and credentials</p>
      </div>

      {/* Main Profile Info Card */}
      <div className="p-6 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-3xl">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1 space-y-2 text-center md:text-left">
          <h3 className="text-2xl font-bold tracking-tight">{user.name}</h3>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              {user.email}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold border border-primary/30">
              <Award className="w-3.5 h-3.5" />
              {user.plan}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="px-5 py-2.5 rounded-xl border border-destructive text-destructive hover:bg-destructive/10 text-xs font-bold transition-colors cursor-pointer select-none"
        >
          Logout Account
        </button>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/50 text-muted-foreground">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-medium block">{stat.label}</span>
                <span className="font-mono font-bold text-lg text-foreground">{stat.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Constraints info box */}
      <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
        <h4 className="font-bold text-sm">Quantara Sandbox Constraints</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          As a member of our beta pilot, you are currently trading in the **Indian Market (NIFTY 50 assets only)**. 
          AI advisor prompts, RAG documents, and ML models are locked to this workspace.
        </p>
      </div>
    </div>
  );
}
