export default function SkeletonLoader({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 rounded-xl bg-white/10" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-24 rounded-2xl bg-white/5" />
      ))}
    </div>
  );
}
