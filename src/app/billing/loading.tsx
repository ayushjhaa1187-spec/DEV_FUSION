import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-4">
      <SkeletonLoader className="h-10 w-56" />
      <div className="grid md:grid-cols-2 gap-4">
        <SkeletonLoader className="h-36" />
        <SkeletonLoader className="h-36" />
      </div>
    </div>
  );
}
