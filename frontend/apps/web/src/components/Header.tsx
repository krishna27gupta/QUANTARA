"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Bell, Search, User } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  
  // Format current page title
  const getTitle = () => {
    if (pathname === "/" || pathname === "/home") return "Dashboard";
    const path = pathname.split("/")[1];
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{getTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Mock Search */}
        <div className="hidden sm:flex items-center gap-2 bg-secondary/50 border border-border px-3 py-1.5 rounded-xl w-60 group focus-within:border-primary/50 transition-colors">
          <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <input
            type="text"
            placeholder="Search assets, charts, logs..."
            className="bg-transparent text-sm border-none outline-none text-foreground placeholder-muted-foreground w-full"
          />
        </div>

        {/* Action Buttons */}
        <button className="p-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors text-muted-foreground hover:text-foreground relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold cursor-pointer hover:bg-primary/20 transition-colors">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
