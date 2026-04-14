import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SkeletonLoader className="h-48 rounded-[40px] mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLoader key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SkeletonLoader className="lg:col-span-2 h-96 rounded-[40px]" />
        <SkeletonLoader className="h-96 rounded-[40px]" />
      </div>
    </div>
  );
}
