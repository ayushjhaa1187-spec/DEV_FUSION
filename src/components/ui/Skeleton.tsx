import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: boolean;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1rem', rounded = false, className = '' }: SkeletonProps) {
  return (
    <div 
      style={{ 
        width, 
        height, 
        borderRadius: rounded ? '9999px' : 'var(--radius-sm)' 
      }}
      className={`skeleton ${className}`} 
    />
  );
}

export function DoubtCardSkeleton() {
  return (
    <div className="doubt-card-skeleton glass" style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)' }}>
      <Skeleton height="1.5rem" width="60%" className="mb-4" />
      <Skeleton height="1rem" width="90%" className="mb-2" />
      <Skeleton height="1rem" width="70%" className="mb-4" />
      <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
        <Skeleton width="60px" height="24px" rounded />
        <Skeleton width="80px" height="24px" rounded />
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .mb-4 { margin-bottom: 1rem; }
        .mb-2 { margin-bottom: 0.5rem; }
      `}} />
    </div>
  );
}
