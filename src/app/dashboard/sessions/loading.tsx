export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse text-white">
      <div className="h-8 bg-gray-200 dark:bg-white/5 rounded w-1/3 mb-12" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-white/5 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
