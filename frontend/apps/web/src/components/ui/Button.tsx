"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onDragOver" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive" | "ai";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]";
  
  const variants = {
    primary: "bg-accent text-white hover:bg-accent/90 shadow-md",
    secondary: "bg-card text-text-primary border border-border hover:bg-secondary/40",
    ghost: "bg-transparent text-text-primary hover:bg-secondary/20",
    outline: "bg-transparent border border-text-secondary/30 text-text-primary hover:bg-secondary/20",
    destructive: "bg-danger text-white hover:bg-danger/90",
    ai: "relative bg-gradient-to-r from-accent via-indigo-500 to-purple-600 text-white shadow-lg shadow-accent/20 hover:shadow-accent/40"
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base"
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        <span className="flex items-center gap-2 justify-center">
          {variant === "ai" && <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />}
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </span>
      )}
    </motion.button>
  );
}
export default Button;
