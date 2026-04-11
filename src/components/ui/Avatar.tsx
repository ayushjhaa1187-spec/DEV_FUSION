import React from 'react';
import { cn } from './Button';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  userId?: string;
  name?: string;
  reputation?: number;
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string | null;
  showDetails?: boolean;
}

// Simple hash function for color generation
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({
  userId = 'anonymous',
  name = 'Anonymous User',
  reputation,
  size = 'md',
  imageUrl,
  showDetails = false,
  className,
  ...props
}, ref) => {
  const bgColor = stringToColor(userId);
  const initials = getInitials(name);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl'
  };

  return (
    <div ref={ref} className={cn('flex items-center gap-3', className)} {...props}>
      <div 
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-full overflow-hidden text-white font-bold tracking-widest',
          sizeClasses[size]
        )}
        style={{ backgroundColor: imageUrl ? 'transparent' : bgColor }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {showDetails && (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-text-primary leading-tight">{name}</span>
          {reputation !== undefined && (
            <span className="text-xs font-medium text-text-secondary flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              {reputation} XP
            </span>
          )}
        </div>
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';
