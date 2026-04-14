import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0612] py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center mb-10">
          <div className="space-y-2">
            <SkeletonLoader className="h-10 w-48 rounded-xl" />
            <SkeletonLoader className="h-4 w-64 rounded-lg" />
          </div>
          <SkeletonLoader className="h-20 w-40 rounded-2xl" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonLoader className="h-64 rounded-3xl" />
          <SkeletonLoader className="h-64 rounded-3xl" />
          <SkeletonLoader className="h-64 rounded-3xl" />
          <SkeletonLoader className="h-64 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
