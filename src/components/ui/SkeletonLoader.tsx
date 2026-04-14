export default function SkeletonLoader({ 
  rows, 
  className = '' 
}: { 
  rows?: number;
  className?: string;
}) {
  if (rows) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-8 rounded-xl bg-white/10 animate-pulse" />
        {Array.from({ length: rows }).map((_, index) => (
          <div 
            key={index} 
            className="h-24 rounded-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:300%_100%] animate-pulse" 
            style={{ animationDuration: '1.2s' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:300%_100%] ${className}`}
      style={{ animationDuration: '1.2s' }}
      aria-hidden
    />
  );
}
