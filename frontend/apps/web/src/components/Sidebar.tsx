"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { navItems } from "@/lib/navigation";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// If cn utility is not yet created, let's make sure it is safe or define a inline fallback
// We'll write lib/utils.ts right after this.
export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r border-border bg-card text-card-foreground transition-all duration-300 ease-in-out z-20",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link href="/home" className="flex items-center gap-2 font-bold select-none">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          {sidebarOpen && (
            <span className="font-sans text-lg tracking-wider bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent font-extrabold animate-fade-in">
              QUANTARA
            </span>
          )}
        </Link>
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-secondary cursor-pointer transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Icon className={cn("w-5 h-5 min-w-[20px]", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {sidebarOpen ? (
                <span className="truncate">{item.label}</span>
              ) : (
                <span className="absolute left-16 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg border border-border scale-0 group-hover:scale-100 transition-all z-30 pointer-events-none whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle Footer */}
      {!sidebarOpen && (
        <div className="h-16 flex items-center justify-center border-t border-border">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </aside>
  );
}
