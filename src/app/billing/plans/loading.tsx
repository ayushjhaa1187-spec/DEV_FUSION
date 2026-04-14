import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0612] py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <SkeletonLoader className="h-12 w-64 mx-auto rounded-xl" />
          <SkeletonLoader className="h-4 w-96 mx-auto rounded-lg" />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-8 rounded-3xl border border-white/10 bg-white/5 space-y-6">
              <SkeletonLoader className="h-8 w-32 rounded-lg" />
              <SkeletonLoader className="h-12 w-48 rounded-xl" />
              <div className="space-y-4 pt-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <SkeletonLoader className="h-5 w-5 rounded-full" />
                    <SkeletonLoader className="h-4 w-full rounded" />
                  </div>
                ))}
              </div>
              <SkeletonLoader className="h-14 w-full rounded-2xl pt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
