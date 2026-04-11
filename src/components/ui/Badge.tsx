import React from 'react';
import { X } from 'lucide-react';
import { cn } from './Button';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  onClose?: () => void;
}

const badgeVariants: Record<BadgeVariant, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-error/10 text-error border-error/20',
  info: 'bg-info/10 text-info border-info/20',
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({
  className,
  variant = 'primary',
  icon,
  onClose,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-1 inline-flex h-4 w-4 shrink-0 hover:bg-black/10 dark:hover:bg-white/10 items-center justify-center rounded-full text-inherit transition-colors focus:outline-none focus:bg-black/20"
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Remove</span>
        </button>
      )}
    </div>
  );
});

Badge.displayName = 'Badge';
