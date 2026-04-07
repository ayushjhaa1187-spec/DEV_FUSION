# SkillBridge Detailed Backend Implementation Plan

This plan aligns with the comprehensive system requirements provided, focusing on a secure, modular, and AI-powered backend using Next.js and Supabase.

## User Review Required

> [!IMPORTANT]
> **Schema Migration:**
> I will refactor the existing `supabase_schema.sql` to include the requested Enums, Audit Logs, and more granular tables (e.g., `reputation_events`, `practice_tests`). This may consolidate some existing tables for better normalization.

> [!NOTE]
> **AI Usage:**
> I will strictly use **Google Gemini** as the sole AI provider, wrapped in a thin service layer as requested.

## Proposed Changes

### Phase 1: Enhanced Database & RLS
- **[REFRACTOR] `supabase_schema.sql`**: 
  - Add Enums: `user_role`, `doubt_status`, `booking_status`, `notification_type`, `mentor_application_status`.
  - Add Tables: `subjects`, `user_subjects`, `answer_votes`, `reputation_events`, `badges`, `user_badges`, `audit_logs`.
  - Add Tables: `practice_tests`, `practice_questions`, `practice_attempts`, `practice_attempt_answers`.
  - Finalize all RLS policies (Public Read for Community, Authenticated Write with Ownership checks).
- **[NEW] `src/lib/supabase/server.ts` & `admin.ts`**: Implement typed Supabase clients for different security contexts.

### Phase 2: Community Backend (Doubts & Answers)
- **[NEW] API Routes**:
  - `GET /api/doubts` (with filters: subject, branch, trending).
  - `POST /api/doubts` (with academic context snapshotted).
  - `POST /api/doubts/:id/answers` & `POST /api/answers/:id/vote`.
  - `POST /api/answers/:id/accept` (triggers server-side reputation award).

### Phase 3 & 4: AI Service & Reputation Logic
- **[MODIFY] `src/lib/ai-service.ts`**: Refine prompts for better JSON structure and add rate-limiting guardrails.
- **[NEW] `src/lib/reputation/ledger.ts`**: Implement the append-only `reputation_events` logic.
- **[MODIFY] `supabase_functions.sql`**: Update triggers to record events in the ledger instead of just updating counters.

### Phase 5 & 6: Mentor Flow & Practice Tests
- **[NEW] Mentor Workflow**: `mentor_applications` submission and admin review routes.
- **[NEW] Practice Test Lifecycle**: 
  - `POST /api/tests/generate` (AI-driven).
  - `POST /api/tests/:id/submit` (atomic scoring and reputation award).
- **[NEW] Audit Logging**: Middleware or utility to record critical state changes.

---

## Open Questions

1. **Jitsi Integration:** For live sessions, would you prefer I generate a unique Jitsi room name for every booking, or allowing mentors to provide their own static Google Meet links?
2. **Badge Logic:** Should I implement an automatic "Badge Checker" that runs on every reputation gain, or a periodic cleanup job?
3. **Pagination:** I'll implement cursor-based pagination for the doubt feed as a default for scalability. Any preference?

## Verification Plan

### Automated Tests
- CLI script to verify RLS policies against different mock user roles (Student vs Mentor).
- Build check for TypeScript types consistency with the new schema.

### Manual Verification
- Testing the "Accepted Answer" flow ensures points appear in the ledger.
- Verifying that AI-generated questions are stored and scored correctly.
