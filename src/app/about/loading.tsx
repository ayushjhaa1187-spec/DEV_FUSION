export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse text-white">
      <div className="h-48 bg-gray-200 dark:bg-white/5 rounded-3xl mb-12" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 dark:bg-white/5 rounded-2xl h-64 border border-white/5" />
        ))}
      </div>
    </div>
  );
}
