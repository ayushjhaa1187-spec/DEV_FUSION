import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { Loader2 } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-opacity-90 shadow-sm hover:shadow-md border border-transparent',
  secondary: 'bg-bg-tertiary text-text-primary hover:bg-border-color border border-border-color shadow-sm',
  tertiary: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary underline-offset-4 hover:underline border border-transparent',
  danger: 'bg-error text-white hover:bg-opacity-90 shadow-sm border border-transparent',
  success: 'bg-success text-white hover:bg-opacity-90 shadow-sm border border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 py-2 text-sm',
  lg: 'h-12 px-8 text-base font-semibold',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  icon, 
  children, 
  className,
  disabled,
  ...props 
}, ref) => {
  return (
    <button 
      ref={ref}
      disabled={loading || disabled} 
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-bg-primary gap-2',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!loading && icon && icon}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

