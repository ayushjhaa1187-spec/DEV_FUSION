import React from 'react';
import { cn } from './Button';
import { Lock } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

export interface AchievementCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon: React.ReactNode;
  isUnlocked?: boolean;
  progress?: number;
  maxProgress?: number;
  earnedAt?: string;
}

export const AchievementCard = React.forwardRef<HTMLDivElement, AchievementCardProps>(({
  title,
  description,
  icon,
  isUnlocked = false,
  progress,
  maxProgress = 100,
  earnedAt,
  className,
  ...props
}, ref) => {
  return (
    <div 
      ref={ref}
      className={cn(
        'relative flex items-start gap-4 p-5 rounded-2xl border overflow-hidden transition-all duration-300',
        isUnlocked 
          ? 'bg-bg-secondary border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40' 
          : 'bg-bg-tertiary border-border-color opacity-80 grayscale',
        className
      )}
      {...props}
    >
      {/* Icon Badge */}
      <div className={cn(
        'flex shrink-0 items-center justify-center w-16 h-16 rounded-2xl shadow-inner',
        isUnlocked ? 'bg-bg-primary text-primary' : 'bg-bg-secondary text-text-tertiary'
      )}>
        {isUnlocked ? icon : <Lock className="w-6 h-6 opacity-50" />}
      </div>

      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className={cn(
            'font-bold text-base truncate',
            isUnlocked ? 'text-text-primary' : 'text-text-secondary'
          )}>{title}</h4>
          {isUnlocked && earnedAt && (
            <span className="text-[10px] uppercase font-bold text-text-tertiary whitespace-nowrap bg-bg-primary px-2 py-1 rounded-full border border-border-color">
              {new Date(earnedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        
        <p className="text-sm text-text-secondary line-clamp-2">
          {description}
        </p>

        {!isUnlocked && progress !== undefined && (
          <div className="pt-2">
            <ProgressBar 
              value={progress} 
              max={maxProgress} 
              size="sm" 
              color="primary" 
            />
            <p className="text-xs text-text-tertiary mt-1 text-right font-medium">
              {progress} / {maxProgress}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

AchievementCard.displayName = 'AchievementCard';
