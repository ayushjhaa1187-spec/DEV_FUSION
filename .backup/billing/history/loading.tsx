import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0612] py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <SkeletonLoader className="h-10 w-56 rounded-xl" />
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-white/5 flex gap-4">
            <SkeletonLoader className="h-4 w-24 rounded" />
            <SkeletonLoader className="h-4 w-24 rounded" />
            <SkeletonLoader className="h-4 w-24 rounded" />
          </div>
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div className="flex gap-4 items-center">
                  <SkeletonLoader className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <SkeletonLoader className="h-4 w-32 rounded" />
                    <SkeletonLoader className="h-3 w-48 rounded-sm opacity-50" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <SkeletonLoader className="h-4 w-20 rounded" />
                  <SkeletonLoader className="h-3 w-16 rounded-full ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
