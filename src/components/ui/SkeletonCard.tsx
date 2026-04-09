import React from 'react';

interface SkeletonCardProps {
  count?: number;
}

export function SkeletonCard({ count = 1 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl bg-white/5 border border-white/10 p-5 space-y-3"
          aria-hidden="true"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-white/10 rounded w-1/3" />
              <div className="h-3 bg-white/10 rounded w-1/4" />
            </div>
          </div>
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-3 bg-white/10 rounded w-full" />
            <div className="h-3 bg-white/10 rounded w-5/6" />
          </div>
          <div className="flex gap-2 pt-1">
            <div className="h-5 bg-white/10 rounded w-16" />
            <div className="h-5 bg-white/10 rounded w-16" />
          </div>
        </div>
      ))}
    </>
  );
}

export default SkeletonCard;
