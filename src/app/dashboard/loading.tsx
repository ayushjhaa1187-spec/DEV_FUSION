export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-10 bg-gray-200 dark:bg-white/5 rounded-2xl w-48 mb-2" />
        <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-lg w-64" />
      </div>

      {/* HeatPulse Skeleton */}
      <div className="h-56 bg-white dark:bg-white/5 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-sm" />

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 bg-gray-100/50 dark:bg-white/5 rounded-[32px]" />
            <div className="h-40 bg-gray-100/50 dark:bg-white/5 rounded-[32px]" />
          </div>
          <div className="h-96 bg-gray-100/50 dark:bg-white/5 rounded-[40px]" />
        </div>
        <div className="space-y-10">
          <div className="h-[450px] bg-gray-100/50 dark:bg-white/5 rounded-[40px]" />
          <div className="h-64 bg-gray-100/50 dark:bg-white/5 rounded-[40px]" />
        </div>
      </div>
    </div>
  );
}
