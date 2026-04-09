export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse text-white">
      <div className="h-48 bg-gray-200 dark:bg-white/5 rounded-2xl mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-200 dark:bg-white/5 rounded-2xl h-32 border border-white/5" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 dark:bg-white/5 rounded-2xl border border-white/5" />
    </div>
  );
}
