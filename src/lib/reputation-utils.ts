export const REPUTATION_WEIGHTS: Record<string, number> = {
  question_posted: 5,
  answer_posted: 10,
  answer_accepted: 50,
  upvote_received: 7,
  downvote_received: -3,
  badge_earned: 25,
  test_completed: 15,
  test_perfect_score: 30,
};

export const ALL_BADGES = [
  { id: 'rising-star', name: 'Rising Star', icon: '✨', description: 'Begin your journey as a recognized contributor.', requirement_points: 100 },
  { id: 'problem-solver', name: 'Problem Solver', icon: '🛠️', description: 'Help others by providing verified solutions.', requirement_points: 500 },
  { id: 'knowledge-guru', name: 'Knowledge Guru', icon: '🧠', description: 'Become a pillar of the learning community.', requirement_points: 1000 },
  { id: 'legend', name: 'Legend', icon: '👑', description: 'Reach the pinnacle of academic mastery.', requirement_points: 5000 },
];

export function getRank(points: number) {
  if (points >= 5000) return 'Legend';
  if (points >= 1000) return 'Knowledge Guru';
  if (points >= 500) return 'Problem Solver';
  if (points >= 100) return 'Rising Star';
  return 'Beginner';
}

export function getUnlockedBadges(points: number) {
  return ALL_BADGES.filter(b => points >= b.requirement_points);
}

export interface ReputationEvent {
  type: string;
  count?: number;
}

export function calculateReputation(events: ReputationEvent[]): number {
  return events.reduce((total, event) => {
    const weight = REPUTATION_WEIGHTS[event.type] ?? 0;
    return total + weight * (event.count ?? 1);
  }, 0);
}

export const BADGE_THRESHOLDS = [
  { min: 100, badge: 'Rising Star' },
  { min: 500, badge: 'Problem Solver' },
  { min: 1000, badge: 'Knowledge Guru' },
  { min: 5000, badge: 'Legend' },
];
