export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-[40px] mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-[40px]" />
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-[40px]" />
      </div>
    </div>
  );
}
