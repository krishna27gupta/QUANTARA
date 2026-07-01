"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, sidebar, className }: LayoutProps) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start", className)}>
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-6 w-full">
        {children}
      </div>

      {/* Sidebar Area */}
      {sidebar && (
        <div className="space-y-6 w-full">
          {sidebar}
        </div>
      )}
    </div>
  );
}
export default DashboardLayout;
