"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border/40 bg-card/80 backdrop-blur-lg flex items-center justify-around px-2 pb-safe z-20 shadow-soft">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
        const Icon = item.icon;
        
        // Show truncated "Ask" on mobile instead of "Ask Quantara"
        const label = item.label === "Ask Quantara" ? "Ask" : item.label;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-all duration-200",
              isActive
                ? "text-accent scale-105"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[64px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
