export const REPUTATION_POINTS = {
  ANSWER_POSTED: 10,
  ANSWER_ACCEPTED: 25,
  DAILY_LOGIN: 2,
  TEST_COMPLETED: 5,
};

export const BADGES = [
  { id: 'first_answer', name: 'First Answer', icon: '✍️', threshold: 10 },
  { id: 'helpful_mentor', name: 'Helpful Mentor', icon: '🤝', threshold: 100 },
  { id: 'streak_master', name: 'Streak Master', icon: '🔥', threshold: 50 },
  { id: 'subject_expert', name: 'Subject Expert', icon: '🎓', threshold: 250 },
];

export function getRank(points: number) {
  if (points >= 1000) return 'Scholar';
  if (points >= 500) return 'Expert';
  if (points >= 100) return 'Contributor';
  return 'Beginner';
}

export function getUnlockedBadges(points: number) {
  return BADGES.filter(badge => points >= badge.threshold);
}
