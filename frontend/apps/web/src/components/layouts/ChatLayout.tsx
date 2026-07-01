"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ChatLayoutProps {
  chatHeader: React.ReactNode;
  messageStream: React.ReactNode;
  inputBar: React.ReactNode;
  className?: string;
}

export function ChatLayout({
  chatHeader,
  messageStream,
  inputBar,
  className,
}: ChatLayoutProps) {
  return (
    <div className={cn("flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto border border-border bg-card rounded-[20px] overflow-hidden glass", className)}>
      {/* Top Banner Header */}
      <div className="shrink-0">{chatHeader}</div>

      {/* Message Feed Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">{messageStream}</div>

      {/* Bottom Input Area */}
      <div className="shrink-0">{inputBar}</div>
    </div>
  );
}
export default ChatLayout;
