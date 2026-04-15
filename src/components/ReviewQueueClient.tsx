'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, BookOpen, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReviewItem {
  id: string;
  concept_id: string;
  subject: string;
  due_at: string;
  ease_factor: number;
  repetitions: number;
  last_score: number | null;
}

interface ReviewStats {
  totalInQueue: number;
  pendingToday: number;
  avgEaseFactor: number;
  totalRepetitions: number;
}

export function ReviewQueueClient() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch pending items
        const itemsRes = await fetch('/api/review-queue?view=pending&limit=10');
        if (!itemsRes.ok) throw new Error('Failed to fetch items');
        const { items: pendingItems } = await itemsRes.json();
        setItems(pendingItems);

        // Fetch stats
        const statsRes = await fetch('/api/review-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-stats' }),
        });
        if (!statsRes.ok) throw new Error('Failed to fetch stats');
        const statsData = await statsRes.json();
        setStats(statsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  const hasItems = items && items.length > 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">In Review Queue</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalInQueue}</p>
              </div>
              <BookOpen className="text-blue-500 opacity-20" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Due Today</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingToday}</p>
              </div>
              <Clock className="text-amber-500 opacity-20" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg Ease</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.avgEaseFactor.toFixed(1)}</p>
              </div>
              <Zap className="text-purple-500 opacity-20" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Repetitions</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalRepetitions}</p>
              </div>
              <BookOpen className="text-green-500 opacity-20" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Pending Items List */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Pending Reviews
          </h3>
          {hasItems && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              {items.length} concepts
            </span>
          )}
        </div>

        {!hasItems ? (
          <div className="text-center py-8">
            <BookOpen className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={32} />
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              No reviews due today. Great job staying on track!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/practice?concept=${encodeURIComponent(item.concept_id)}`}
              >
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition cursor-pointer group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {item.concept_id.replace(/-/g, ' ').toUpperCase()}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {item.subject}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Ease: {item.ease_factor.toFixed(1)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Reps: {item.repetitions}
                      </div>
                    </div>
                  </div>

                  {item.last_score !== null && (
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <span>Last score: {Math.round(item.last_score * 100)}%</span>
                      <span>
                        Due: {new Date(item.due_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      {hasItems && stats && stats.pendingToday > 0 && (
        <Button
          asChild
          size="lg"
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          <Link href="/practice?filter=review-queue">
            Start Review Session ({stats.pendingToday} due today)
          </Link>
        </Button>
      )}
    </div>
  );
}
