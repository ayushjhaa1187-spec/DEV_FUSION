import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 text-white">
      <SkeletonLoader className="h-8 w-1/3 mb-6" />
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <SkeletonLoader key={i} className="h-64 border border-white/5" />
        ))}
      </div>
    </div>
  );
}
