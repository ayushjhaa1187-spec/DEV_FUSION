export type PlanTier = 'free' | 'pro' | 'elite';

export const PLAN_DETAILS: Record<PlanTier, { name: string; aiDaily: number | null; testsWeekly: number | null }> = {
  free: { name: 'Free', aiDaily: 5, testsWeekly: 3 },
  pro: { name: 'Pro', aiDaily: 50, testsWeekly: 20 },
  elite: { name: 'Elite', aiDaily: null, testsWeekly: null },
};

export const CREDIT_PACKS = {
  starter: { credits: 50, amountInr: 49 },
  value: { credits: 150, amountInr: 129 },
  bulk: { credits: 500, amountInr: 349 },
  exam_sprint: { credits: 1000, amountInr: 599 },
} as const;

export type CreditPackKey = keyof typeof CREDIT_PACKS;
