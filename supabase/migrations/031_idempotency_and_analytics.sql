-- Migration 031: Idempotency and High-Density Analytics
-- Ensures each transaction is processed once and optimizes aggregate engagement queries.

-- 1. Idempotency Table for Webhooks
CREATE TABLE IF NOT EXISTS public.processed_webhooks (
  id TEXT PRIMARY KEY, -- Usually the provider's transaction/payment ID
  provider TEXT NOT NULL,
  event_type TEXT,
  payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup during high-traffic spikes
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_provider ON public.processed_webhooks(provider, processed_at);

-- 2. Performance Indexes for Institutional Analytics
-- Optimizing: SELECT action, COUNT(*) FROM rep_history WHERE user_id IN (group)
CREATE INDEX IF NOT EXISTS idx_reputation_history_action_user ON public.reputation_history(action, user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_history_created ON public.reputation_history(created_at);

-- 3. Utility Function: get_org_engagement
-- This speeds up the aggregate engagement query for the organization dashboard
CREATE OR REPLACE FUNCTION public.get_org_engagement(p_org_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE (
  action TEXT,
  activity_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rh.action,
    COUNT(*) as activity_count
  FROM public.reputation_history rh
  JOIN public.organization_memberships om ON rh.user_id = om.user_id
  WHERE om.organization_id = p_org_id
    AND om.status = 'active'
    AND rh.created_at > now() - (p_days || ' days')::interval
  GROUP BY rh.action
  ORDER BY activity_count DESC;
END;
$$;
