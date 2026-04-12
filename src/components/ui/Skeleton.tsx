import React from 'react';
import { cn } from './Button';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(({
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'animate-pulse rounded-xl bg-bg-tertiary/80',
        className
      )}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

// Example composed skeleton for backward compatibility
export const DoubtCardSkeleton = () => {
  return (
    <div className="p-6 rounded-2xl bg-bg-secondary border border-border-color space-y-4">
      <Skeleton className="h-6 w-[60%]" />
      <Skeleton className="h-4 w-[90%]" />
      <Skeleton className="h-4 w-[70%]" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 !rounded-full" />
        <Skeleton className="h-6 w-20 !rounded-full" />
      </div>
    </div>
  );
};

