import { z } from 'zod';

export const createDoubtSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  body: z.string().min(20, 'Body must be at least 20 characters').max(5000),
  subject: z.string().min(1, 'Subject is required'),
  tags: z.array(z.string()).max(5).optional().default([]),
});

export const createAnswerSchema = z.object({
  body: z.string().min(10, 'Answer must be at least 10 characters').max(10000),
  doubt_id: z.string().uuid(),
});

export const voteSchema = z.object({
  target_id: z.string().uuid(),
  target_type: z.enum(['doubt', 'answer']),
  vote_type: z.enum(['up', 'down']),
});

export const aiSolveSchema = z.object({
  doubt: z.string().min(10).max(2000),
  subject: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate'),
});

export const generateTestSchema = z.object({
  subject: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  num_questions: z.number().int().min(5).max(20).optional().default(10),
  topic: z.string().optional(),
});

export const submitTestSchema = z.object({
  test_id: z.string().uuid(),
  answers: z.array(
    z.object({
      question_index: z.number().int().min(0),
      selected_option: z.number().int().min(0).max(3),
    })
  ),
});

export const bookMentorSchema = z.object({
  mentor_id: z.string().uuid(),
  slot_id: z.string().uuid(),
  duration_mins: z.number().int().refine((v) => [30, 60, 90].includes(v), {
    message: 'duration_mins must be 30, 60, or 90',
  }),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  booking_id: z.string().uuid(),
});

export const rateSessionSchema = z.object({
  booking_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(500).optional(),
});

export const mentorApplicationSchema = z.object({
  subjects: z.array(z.string()).min(1).max(5),
  bio: z.string().min(50).max(1000),
  hourly_rate: z.number().min(99).max(2000),
  experience_years: z.number().int().min(0).max(30),
  linkedin_url: z.string().url().optional(),
});

export type CreateDoubtInput = z.infer<typeof createDoubtSchema>;
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type AIsolveInput = z.infer<typeof aiSolveSchema>;
export type GenerateTestInput = z.infer<typeof generateTestSchema>;
export type SubmitTestInput = z.infer<typeof submitTestSchema>;
export type BookMentorInput = z.infer<typeof bookMentorSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RateSessionInput = z.infer<typeof rateSessionSchema>;
export type MentorApplicationInput = z.infer<typeof mentorApplicationSchema>;
