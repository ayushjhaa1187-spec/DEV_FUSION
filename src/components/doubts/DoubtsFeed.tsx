'use client';

import { useEffect, useState } from 'react';
import { doubtApi } from '@/lib/api';
import DoubtCard from './DoubtCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface DoubtsFeedProps {
  limit?: number;
  authorId?: string;
  subjectId?: string;
}

export default function DoubtsFeed({ limit = 5, authorId, subjectId }: DoubtsFeedProps) {
  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const params: Record<string, any> = { limit };
        if (authorId) params.author_id = authorId;
        if (subjectId) params.subject_id = subjectId;
        const data = await doubtApi.getDoubts(params);
        setDoubts(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load doubts');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [limit, authorId, subjectId]);

  if (loading) return <SkeletonCard count={limit} />;
  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (doubts.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-col gap-3">
      {doubts.map((doubt) => (
        <DoubtCard key={doubt.id} doubt={doubt} />
      ))}
    </div>
  );
}
