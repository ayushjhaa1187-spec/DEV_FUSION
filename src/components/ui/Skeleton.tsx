import React from 'react';
import { cn } from './Button';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Premium Skeleton Component
 * Using refined shimmer animations for perceived performance.
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(({
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden bg-white/5 rounded-xl',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.05] before:to-transparent',
        className
      )}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

export const DoubtCardSkeleton = () => {
  return (
    <div className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-6">
      <Skeleton className="h-8 w-[70%] rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[60%]" />
      </div>
      <div className="flex items-center gap-4 pt-6 border-t border-white/5">
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-16 opacity-50" />
        </div>
      </div>
    </div>
  );
};

