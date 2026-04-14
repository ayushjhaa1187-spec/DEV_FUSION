import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 text-white">
      <SkeletonLoader rows={3} />
    </div>
  );
}
