export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/3"></div>
        <div className="h-4 bg-gray-100 dark:bg-gray-800/50 rounded-md w-1/4"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50"></div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="h-64 bg-gray-100 dark:bg-gray-800/50 rounded-2xl"></div>
          <div className="h-96 bg-gray-100 dark:bg-gray-800/50 rounded-2xl"></div>
        </div>
        <div className="space-y-8">
          <div className="h-80 bg-gray-100 dark:bg-gray-800/50 rounded-2xl"></div>
          <div className="h-60 bg-gray-100 dark:bg-gray-800/50 rounded-2xl"></div>
        </div>
      </div>
    </div>
  )
}
