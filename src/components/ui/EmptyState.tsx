import React from 'react';
import { cn } from './Button';
import { Button } from './Button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  actionIcon,
  className,
  ...props
}, ref) => {
  return (
    <div 
      ref={ref}
      className={cn(
        "flex flex-col w-full min-h-[300px] items-center justify-center p-8 text-center rounded-3xl border border-dashed border-border-color bg-bg-secondary/50",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-tertiary mb-6 text-text-secondary">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-heading font-bold text-text-primary mb-2 mt-0">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mx-auto mb-8 leading-relaxed">{description}</p>
      
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} icon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

