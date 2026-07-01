-- ============================================================
-- TEXTILE IMPRESSIONS - Email System Tables
-- ============================================================

-- Add email column to custom_orders (frontend already collects it)
ALTER TABLE public.custom_orders
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Add email column to incubator_enquiries (frontend already collects it)
ALTER TABLE public.incubator_enquiries
  ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================================
-- email_logs — tracks every sent email for audit + dedup
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced', 'dropped')),
  dedup_key TEXT,
  message_id TEXT,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_dedup_key ON public.email_logs(dedup_key);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

-- ============================================================
-- email_queue — async processing with retry support
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  dedup_key TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON public.email_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_email_queue_dedup ON public.email_queue(dedup_key);
CREATE INDEX IF NOT EXISTS idx_email_queue_retry ON public.email_queue(next_retry_at)
  WHERE status = 'failed' AND next_retry_at IS NOT NULL;

-- Enable RLS (all access via service role only, no public access needed)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT on email_logs
CREATE POLICY "email_logs_select_admin" ON public.email_logs
  FOR SELECT USING (public.is_admin());

-- Admin-only SELECT on email_queue
CREATE POLICY "email_queue_select_admin" ON public.email_queue
  FOR SELECT USING (public.is_admin());

-- Service role INSERT access (via service_role client)
CREATE POLICY "email_logs_insert_service" ON public.email_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "email_queue_insert_service" ON public.email_queue
  FOR INSERT WITH CHECK (true);

CREATE POLICY "email_queue_update_service" ON public.email_queue
  FOR UPDATE USING (true);
