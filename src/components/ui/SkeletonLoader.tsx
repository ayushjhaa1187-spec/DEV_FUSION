export default function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:300%_100%] ${className}`}
      style={{ animationDuration: '1.2s' }}
      aria-hidden
    />
  );
}
