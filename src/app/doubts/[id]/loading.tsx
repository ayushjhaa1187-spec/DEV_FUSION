export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse text-white">
      <div className="h-6 bg-white/5 rounded w-24 mb-6" />
      <div className="h-12 bg-white/5 rounded-xl w-3/4 mb-4" />
      <div className="h-4 bg-white/5 rounded-xl w-1/4 mb-12" />
      <div className="h-64 bg-white/5 rounded-[40px] border border-white/5 mb-12" />
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 bg-white/5 rounded-[40px] border border-white/5" />
        ))}
      </div>
    </div>
  );
}
