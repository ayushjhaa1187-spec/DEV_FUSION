import React from 'react';
import { cn } from './Button';
import { Card, CardContent } from './Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  suffix?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(({
  label,
  value,
  icon,
  suffix,
  trend,
  className,
  ...props
}, ref) => {
  return (
    <Card ref={ref} className={cn('overflow-hidden', className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 text-text-secondary pb-2">
          <h3 className="tracking-tight text-sm font-medium uppercase space-x-1">{label}</h3>
          {icon && <div className="text-text-tertiary">{icon}</div>}
        </div>
        <div className="flex items-baseline gap-1 mt-2">
          <div className="text-3xl font-heading font-bold text-text-primary">{value}</div>
          {suffix && <div className="text-sm font-medium text-text-secondary">{suffix}</div>}
        </div>
        
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium mt-3',
            trend.direction === 'up' ? 'text-success' : trend.direction === 'down' ? 'text-error' : 'text-neutral'
          )}>
            {trend.direction === 'up' && <ArrowUpRight className="h-4 w-4" />}
            {trend.direction === 'down' && <ArrowDownRight className="h-4 w-4" />}
            <span>{trend.value}% {trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';
