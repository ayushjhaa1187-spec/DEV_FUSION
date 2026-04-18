/**
 * Review Queue Service
 * Implements SM-2 spaced repetition algorithm for concept mastery
 * Enqueues weak concepts (score < 60%) for scheduled review
 */

import { createSupabaseServer } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ReviewQueueItem {
  id: string;
  student_id: string;
  concept_id: string;
  subject: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
  last_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ConceptScore {
  concept: string;
  subject: string;
  score: number; // 0 to 1 (percentage / 100)
}

/**
 * SM-2 Algorithm: Calculate ease factor based on test performance
 * Formula: ease_factor = ease_factor + (0.1 - (0.08 * (0.6 - quality)))
 * Where quality = normalized score (0-1)
 * Minimum ease_factor = 1.3
 */
export function calculateEaseFactor(
  currentEaseFactor: number,
  score: number // 0 to 1
): number {
  const quality = score; // Quality input is the score itself
  const newEase =
    currentEaseFactor + (0.1 - 0.08 * (0.6 - quality));
  return Math.max(1.3, newEase);
}

/**
 * SM-2: Calculate next interval (in days)
 * 1st repetition: 1 day
 * 2nd repetition: 3 days
 * 3rd+ repetition: ease_factor * previous_interval
 */
export function calculateNextInterval(
  repetitions: number,
  easeFactor: number,
  previousInterval: number = 1
): number {
  if (repetitions === 0) return 1;
  if (repetitions === 1) return 3;
  return Math.round(easeFactor * previousInterval);
}

/**
 * Update review queue for a concept score
 * If score < 0.6 (60%), enqueue with SM-2 adjustment
 * Called after every practice attempt
 */
export async function updateReviewQueue(
  studentId: string,
  conceptScores: ConceptScore[]
): Promise<void> {
  const supabase = await createSupabaseServer();

  for (const { concept, subject, score } of conceptScores) {
    if (score < 0.6) {
      // Enqueue weak concept for review
      const { error } = await supabase.rpc('handle_review_queue_update', {
        p_student_id: studentId,
        p_concept_id: concept,
        p_subject: subject,
        p_test_score: score,
      });

      if (error) {
        console.error(`Review queue error for ${concept}:`, error);
        // Non-fatal: attempt is already recorded
      }
    }
  }
}

/**
 * Get all pending review items for a student
 * Returns items where due_at <= now()
 */
export async function getPendingReviewItems(
  studentId: string,
  limit: number = 20
): Promise<ReviewQueueItem[]> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from('review_queue')
    .select('*')
    .eq('student_id', studentId)
    .lte('due_at', new Date().toISOString())
    .order('due_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch pending review items:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all review queue items for a student (including future)
 */
export async function getAllReviewItems(
  studentId: string
): Promise<ReviewQueueItem[]> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from('review_queue')
    .select('*')
    .eq('student_id', studentId)
    .order('due_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch review items:', error);
    return [];
  }

  return data || [];
}

/**
 * Mark a review item as completed
 * Updates SM-2 parameters based on new score
 */
export async function completeReviewItem(
  reviewQueueId: string,
  studentId: string,
  newScore: number // 0 to 1
): Promise<void> {
  const supabase = await createSupabaseServer();

  const { data: item } = await supabase
    .from('review_queue')
    .select('*')
    .eq('id', reviewQueueId)
    .eq('student_id', studentId)
    .single();

  if (!item) {
    throw new Error('Review queue item not found');
  }

  // Calculate new SM-2 parameters
  const newEaseFactor = calculateEaseFactor(item.ease_factor, newScore);
  const newInterval = calculateNextInterval(
    item.repetitions + 1,
    newEaseFactor,
    item.interval_days
  );

  const { error } = await supabase
    .from('review_queue')
    .update({
      ease_factor: newEaseFactor,
      interval_days: newInterval,
      repetitions: item.repetitions + 1,
      due_at: new Date(
        Date.now() + newInterval * 24 * 60 * 60 * 1000
      ).toISOString(),
      last_score: newScore,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewQueueId);

  if (error) {
    throw new Error(`Failed to complete review: ${error.message}`);
  }
}

/**
 * Get review statistics for dashboard display
 */
export async function getReviewStats(
  studentId: string
): Promise<{
  totalInQueue: number;
  pendingToday: number;
  avgEaseFactor: number;
  totalRepetitions: number;
}> {
  const supabase = await createSupabaseServer();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from('review_queue')
    .select('*')
    .eq('student_id', studentId);

  if (!data) {
    return {
      totalInQueue: 0,
      pendingToday: 0,
      avgEaseFactor: 0,
      totalRepetitions: 0,
    };
  }

  const totalInQueue = data.length;
  const pendingToday = data.filter((item) => item.due_at <= now).length;
  const avgEaseFactor =
    data.length > 0
      ? data.reduce((sum, item) => sum + item.ease_factor, 0) / data.length
      : 0;
  const totalRepetitions = data.reduce((sum, item) => sum + item.repetitions, 0);

  return {
    totalInQueue,
    pendingToday,
    avgEaseFactor: Math.round(avgEaseFactor * 100) / 100,
    totalRepetitions,
  };
}

/**
 * Extract concepts from test and calculate per-concept scores
 * Assumes test_questions have a 'topic' field categorizing concepts
 */
export async function extractConceptScores(
  attemptId: string,
  testId: string
): Promise<ConceptScore[]> {
  const supabase = await createSupabaseServer();

  // Get test subject
  const { data: test } = await supabase
    .from('global_tests')
    .select('subject, topic')
    .eq('id', testId)
    .single();

  if (!test) {
    console.warn('Test not found for attempt', attemptId);
    return [];
  }

  // Get answers for this attempt, with question topics
  const { data: answers } = await supabase
    .from('test_attempt_answers')
    .select('question_id, is_correct')
    .eq('attempt_id', attemptId);

  if (!answers || answers.length === 0) {
    return [];
  }

  // Fetch question details to get topics
  const questionIds = answers.map((a) => a.question_id);
  const { data: questions } = await supabase
    .from('global_test_questions')
    .select('id, question_text') // In global_tests, question is the concept for now
    .in('id', questionIds);

  if (!questions) {
    return [];
  }

  // Group answers by topic and calculate per-topic scores
  const conceptScores: Record<string, { correct: number; total: number }> = {};

  answers.forEach((answer) => {
    const question = questions.find((q) => q.id === answer.question_id);
    const concept = test.topic; // We'll use the test topic as the concept for unified scoring

    if (!conceptScores[concept]) {
      conceptScores[concept] = { correct: 0, total: 0 };
    }
    conceptScores[concept].total += 1;
    if (answer.is_correct) {
      conceptScores[concept].correct += 1;
    }
  });

  // Convert to percentage scores
  return Object.entries(conceptScores).map(([concept, scores]) => ({
    concept,
    subject: test.subject,
    score: scores.correct / scores.total,
  }));
}
