"use client";

export default function Loading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-14 bg-secondary/50 rounded-2xl w-1/3" />

      {/* Grid Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <div className="h-3 bg-secondary rounded w-1/2" />
            <div className="h-8 bg-secondary rounded w-3/4" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-card border border-border rounded-2xl p-6" />
        <div className="h-64 bg-card border border-border rounded-2xl p-6" />
      </div>
    </div>
  );
}
