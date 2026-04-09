export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse text-white">
      <div className="h-8 bg-white/5 rounded w-1/4 mb-12" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-white/5 rounded-[40px] border border-white/5" />
        ))}
      </div>
    </div>
  );
}
