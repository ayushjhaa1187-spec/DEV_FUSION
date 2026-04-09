export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse text-white">
      <div className="h-8 bg-gray-200 dark:bg-white/5 rounded w-1/3 mb-6" />
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 dark:bg-white/5 rounded-xl h-64 border border-white/5" />
        ))}
      </div>
    </div>
  );
}
