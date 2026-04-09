# SkillBridge - Peer Learning & Doubt Resolution Platform

SkillBridge is a production-ready web application designed for students to resolve academic doubts through AI, community support, and expert mentorship.

## 🚀 Product Flow
1. **ASK AI FIRST**: Get instant, structured explanations from Google Gemini 1.5 Pro.
2. **COMMUNITY ESCALATION**: If AI isn't enough, escalate to the community feed.
3. **MENTOR MARKETPLACE**: Book 1-on-1 sessions with verified mentors for deep dives.
4. **PRACTICE & REINFORCE**: Take AI-generated tests to track progress and earn reputation.

## 🛠️ Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js Server Actions, Supabase (Auth, DB, Realtime, Storage)
- **AI**: Google Gemini API
- **Payments**: Razorpay (Sandbox)
- **Email**: Resend
- **Analytics**: PostHog, Sentry

## 🏗️ Architecture
The application follows a modular architecture:
- `src/app`: Feature-based routing and pages.
- `src/components`: Reusable UI components and feature-specific blocks.
- `src/lib`: Core services (AI, reputation engine, payments, notifications).
- `supabase/`: Database migrations, seed data, and RLS policies.

## 📈 Reputation Engine
SkillBridge uses an append-only ledger to track student and mentor contributions:
- **Answer Accepted**: +25 points
- **AI Resolution**: +5 points
- **Test Passed**: +15 points
- **Daily Streak**: Incremental bonuses

## 🛠️ Setup Instructions
1. Clone the repo.
2. Install dependencies: `npm install`.
3. Set up environment variables (see `.env.example`).
4. Run migrations: `npx supabase db push`.
5. Start development: `npm run dev`.
