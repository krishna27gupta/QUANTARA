"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { TrendingUp, Lock } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login } = useAuth();
  const pathname = usePathname();

  // Define routes that bypass protection checks
  const isPublicRoute = pathname === "/pricing";

  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border space-y-6 text-center shadow-xl glass animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Secure Route Protected</h2>
            <p className="text-sm text-muted-foreground">
              Please authenticate to access your Quantara swing trading analytics dashboard.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-secondary/30 border border-border/80 flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">Demo Credentials</div>
              <div className="text-[10px] text-muted-foreground">Click below to unlock instant mock access</div>
            </div>
          </div>

          <button
            onClick={login}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold cursor-pointer hover:bg-primary/95 transition-colors select-none text-sm"
          >
            Access with Mock Account
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
