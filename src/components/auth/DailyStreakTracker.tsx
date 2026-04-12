'use client';

import { useEffect } from 'react';
import { reputationApi } from '@/lib/api';
import { useAuth } from './auth-provider';

/**
 * DailyStreakTracker is an invisible component that triggers the daily login
 * points award and streak update when a user is authenticated.
 * The API endpoint handles idempotency via a daily unique key.
 */
export default function DailyStreakTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Call the daily-login API. 
      // It will only award points if they haven't been awarded today.
      reputationApi.awardDailyLogin().catch((err) => {
        // Silent fail for background process
        console.warn('Daily streak update skipped:', err.message);
      });
    }
  }, [user]);

  return null;
}
