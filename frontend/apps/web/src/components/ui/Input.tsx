"use client";

import React from "react";
import { Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Standard Form Input
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-xl border border-border bg-secondary/20 px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors placeholder:text-text-secondary/60 disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// Search Input
export type SearchInputProps = Omit<InputProps, "type">;

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full group">
        <Search className="absolute left-3 w-4 h-4 text-text-secondary/60 group-focus-within:text-text-primary transition-colors" />
        <input
          type="text"
          className={cn(
            "flex w-full rounded-xl border border-border bg-secondary/20 pl-10 pr-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors placeholder:text-text-secondary/60",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

// AI Prompt Input
export interface AIPromptInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSend?: () => void;
}

export const AIPromptInput = React.forwardRef<HTMLTextAreaElement, AIPromptInputProps>(
  ({ className, onSend, ...props }, ref) => {
    return (
      <div className="relative border border-border bg-card rounded-2xl p-3 focus-within:border-accent/50 shadow-md transition-colors glass">
        <textarea
          rows={2}
          className={cn(
            "w-full bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary/50 resize-none pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-xs text-accent">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span>Quantara AI Co-pilot</span>
          </div>
          {onSend && (
            <button
              onClick={onSend}
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-colors cursor-pointer select-none"
            >
              Ask AI
            </button>
          )}
        </div>
      </div>
    );
  }
);
AIPromptInput.displayName = "AIPromptInput";

// Select Dropdown
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex w-full rounded-xl border border-border bg-secondary/20 px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors disabled:opacity-50 cursor-pointer",
          className
        )}
        ref={ref}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-text-primary">
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = "Select";

// Filter Input / Tabs
export interface FilterInputProps {
  options: { label: string; value: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

export const FilterInput = ({ options, selectedValue, onChange, className }: FilterInputProps) => {
  return (
    <div className={cn("flex flex-wrap gap-1.5 bg-secondary/25 p-1 rounded-xl border border-border/60 w-fit", className)}>
      {options.map((opt) => {
        const isActive = opt.value === selectedValue;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            type="button"
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none transition-all",
              isActive 
                ? "bg-accent text-white shadow-sm" 
                : "text-text-secondary hover:text-text-primary hover:bg-secondary/40"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
