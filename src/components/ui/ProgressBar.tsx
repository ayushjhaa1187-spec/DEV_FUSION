import React from 'react';
import { cn } from './Button';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: 'linear' | 'circular';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const colorMap = {
  primary: 'bg-primary text-primary',
  success: 'bg-success text-success',
  warning: 'bg-warning text-warning',
  error: 'bg-error text-error',
  info: 'bg-info text-info',
};

const strokeColorMap = {
  primary: 'stroke-primary',
  success: 'stroke-success',
  warning: 'stroke-warning',
  error: 'stroke-error',
  info: 'stroke-info',
};

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(({
  value,
  max = 100,
  variant = 'linear',
  color = 'primary',
  size = 'md',
  showLabel = false,
  className,
  ...props
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  if (variant === 'circular') {
    const sizeMap = { sm: 40, md: 80, lg: 120 };
    const strokeWidth = { sm: 4, md: 8, lg: 12 };
    const selectedSize = sizeMap[size];
    const sw = strokeWidth[size];
    const radius = (selectedSize - sw) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div ref={ref} className={cn('relative inline-flex items-center justify-center', className)} {...props}>
        <svg width={selectedSize} height={selectedSize} className="transform -rotate-90">
          <circle
            className="stroke-border-color fill-none"
            strokeWidth={sw}
            r={radius}
            cx={selectedSize / 2}
            cy={selectedSize / 2}
          />
          <circle
            className={cn('fill-none transition-all duration-500 ease-in-out', strokeColorMap[color])}
            strokeWidth={sw}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            r={radius}
            cx={selectedSize / 2}
            cy={selectedSize / 2}
          />
        </svg>
        {showLabel && (
          <div className="absolute flex flex-col items-center justify-center font-bold text-text-primary">
            <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-lg' : 'text-3xl'}>
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  // Linear variant
  const heightMap = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div ref={ref} className={cn('w-full flex-col gap-2 flex', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between text-sm font-medium text-text-secondary">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-bg-tertiary overflow-hidden rounded-full', heightMap[size])}>
        <div
          className={cn('h-full transition-all duration-500 ease-in-out rounded-full', colorMap[color].split(' ')[0])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';
