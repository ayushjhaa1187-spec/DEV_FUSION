import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0612] py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <SkeletonLoader className="h-10 w-64 rounded-xl" />
        <div className="grid md:grid-cols-2 gap-6">
          <SkeletonLoader className="h-40 rounded-3xl" />
          <SkeletonLoader className="h-40 rounded-3xl" />
        </div>
        <div className="flex gap-4 pt-8">
          <SkeletonLoader className="h-12 w-32 rounded-xl" />
          <SkeletonLoader className="h-12 w-32 rounded-xl" />
          <SkeletonLoader className="h-12 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
