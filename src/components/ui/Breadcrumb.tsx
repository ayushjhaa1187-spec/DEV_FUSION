import React from 'react';
import { cn } from './Button';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(({
  items,
  separator = <ChevronRight className="w-4 h-4 text-text-tertiary" />,
  className,
  ...props
}, ref) => {
  return (
    <nav ref={ref} aria-label="Breadcrumb" className={cn('flex items-center space-x-2 text-sm', className)} {...props}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const content = (
            <span className={cn(
              'flex items-center gap-1.5 transition-colors',
              isLast 
                ? 'text-text-primary font-semibold' 
                : 'text-text-secondary hover:text-text-primary font-medium'
            )}>
              {item.icon}
              {item.label}
            </span>
          );

          return (
            <li key={index} className="flex items-center space-x-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
                  {content}
                </Link>
              ) : (
                <div aria-current={isLast ? 'page' : undefined}>
                  {content}
                </div>
              )}
              
              {!isLast && (
                <span className="flex items-center justify-center pointer-events-none" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});

Breadcrumb.displayName = 'Breadcrumb';
