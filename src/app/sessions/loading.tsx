function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-1/3" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
          <div className="h-3 bg-white/10 rounded w-1/4" />
        </div>
        <div className="h-8 w-24 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}

export default function SessionsLoading() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header skeleton */}
        <div className="mb-8 space-y-2 animate-pulse">
          <div className="h-8 bg-white/10 rounded w-48" />
          <div className="h-4 bg-white/10 rounded w-64" />
        </div>

        {/* Tab skeleton */}
        <div className="h-12 bg-white/5 rounded-xl mb-6 border border-white/10 animate-pulse" />

        {/* Card skeletons */}
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
