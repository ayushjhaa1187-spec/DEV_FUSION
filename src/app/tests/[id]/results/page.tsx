import { createSupabaseServer } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ResultsClient from './ResultsClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TestResultsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  // Fetch attempt with test and questions
  const { data: attempt, error: attemptError } = await supabase
    .from('practice_attempts')
    .select(`
      *,
      practice_tests (
        id,
        topic,
        subjects (name),
        practice_questions (*)
      )
    `)
    .eq('id', id)
    .single();

  if (attemptError || !attempt) {
    notFound();
  }

  const test = attempt.practice_tests;
  const questions = test.practice_questions || [];

  // Fetch Leaderboard for this topic
  const { data: leaderboard } = await supabase
    .from('test_leaderboard')
    .select('*')
    .eq('topic', test.topic)
    .limit(5);

  return (
    <ResultsClient 
      attempt={attempt} 
      test={test} 
      questions={questions} 
      leaderboard={leaderboard} 
    />
  );
}
