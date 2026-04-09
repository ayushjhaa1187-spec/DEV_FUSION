export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse text-white">
      <div className="h-12 bg-gray-200 dark:bg-white/5 rounded w-1/2 mb-4 mx-auto" />
      <div className="h-6 bg-gray-200 dark:bg-white/5 rounded w-1/3 mb-12 mx-auto" />
      <div className="h-48 bg-gray-200 dark:bg-white/5 rounded-xl mb-12" />
      <div className="space-y-6">
        <div className="h-20 bg-gray-200 dark:bg-white/5 rounded-xl" />
        <div className="h-20 bg-gray-200 dark:bg-white/5 rounded-xl" />
        <div className="h-16 bg-indigo-600/20 rounded-xl" />
      </div>
    </div>
  );
}
