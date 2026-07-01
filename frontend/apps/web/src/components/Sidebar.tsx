"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { useAuth } from "@/context/AuthContext";
import { navItems } from "@/lib/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { ChevronLeft, ChevronRight, TrendingUp, User, Award, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r border-border bg-card text-text-primary transition-all duration-300 ease-in-out z-20 glass shadow-soft",
        sidebarOpen ? "w-66" : "w-20"
      )}
    >
      {/* Brand Header */}
      <div className="h-20 flex flex-col justify-center px-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2 font-bold select-none">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30 text-accent">
              <TrendingUp className="w-5 h-5" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col animate-fade-in">
                <span className="font-sans text-base tracking-wider bg-gradient-to-r from-accent via-indigo-400 to-emerald-400 bg-clip-text text-transparent font-extrabold">
                  QUANTARA
                </span>
                <span className="text-[9px] text-text-secondary/80 font-bold uppercase tracking-widest leading-none">
                  Predict. Analyze. Profit.
                </span>
              </div>
            )}
          </Link>
          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-secondary/40 cursor-pointer transition-colors text-text-secondary hover:text-text-primary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative",
                isActive
                  ? "bg-accent/10 text-accent border-l-2 border-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-secondary/40"
              )}
            >
              <Icon className={cn("w-5 h-5 min-w-[20px]", isActive ? "text-accent" : "text-text-secondary group-hover:text-text-primary")} />
              {sidebarOpen ? (
                <span className="truncate">{item.label}</span>
              ) : (
                <span className="absolute left-16 bg-card text-text-primary text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-border scale-0 group-hover:scale-100 transition-all z-30 pointer-events-none whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-border/40 space-y-3 shrink-0">
        {sidebarOpen ? (
          <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 space-y-3">
            {user && (
              <div className="flex items-center gap-2.5">
                <Link href="/profile" className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center text-accent font-bold cursor-pointer hover:bg-accent/20 transition-colors">
                  <User className="w-4 h-4" />
                </Link>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate text-text-primary">{user.name}</div>
                  <span className="text-[9px] text-text-secondary truncate flex items-center gap-0.5">
                    <Award className="w-2.5 h-2.5 text-accent" />
                    {user.plan}
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <ThemeToggle />
              <Link
                href="/settings"
                className="p-2 rounded-lg hover:bg-secondary/40 transition-colors text-text-secondary hover:text-text-primary"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <Link
              href="/profile"
              className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center text-accent font-bold hover:bg-accent/20 transition-colors"
            >
              <User className="w-4 h-4" />
            </Link>
            <ThemeToggle />
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-secondary/40 cursor-pointer transition-colors text-text-secondary hover:text-text-primary"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
