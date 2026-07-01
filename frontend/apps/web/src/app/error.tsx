"use client";

import { useEffect } from "react";
import { AlertOctagon } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled UI boundary error:", error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
        <AlertOctagon className="w-8 h-8" />
      </div>
      
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold tracking-tight">Application Interface Error</h2>
        <p className="text-sm text-muted-foreground">
          Quantara encountered an unexpected client-side error. Click below to reload the routing context.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold cursor-pointer hover:bg-primary/95 text-sm"
        >
          Reset Framework View
        </button>
      </div>
    </div>
  );
}
