-- ============================================================
-- WORKSHOP PAYMENTS & REGISTRATION ENHANCEMENTS
-- ============================================================

-- ============================================================
-- TABLE: workshop_payments
-- ============================================================
CREATE TABLE public.workshop_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.workshop_registrations(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (method IN ('bank_transfer', 'easypaisa', 'jazzcash', 'stripe')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'verified', 'rejected')),
  proof_url TEXT,
  transaction_ref TEXT,
  rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workshop_payments_registration ON public.workshop_payments(registration_id);
CREATE INDEX idx_workshop_payments_status ON public.workshop_payments(status);

-- ============================================================
-- ALTER: workshop_registrations — add new columns
-- ============================================================
ALTER TABLE public.workshop_registrations
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'none'
    CHECK (payment_status IN ('none', 'awaiting', 'submitted', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waitlisted_at TIMESTAMPTZ;

-- ============================================================
-- UPDATE existing registrations to new status format
-- MUST run before changing the CHECK constraint
-- ============================================================
-- Migrate old 'registered' status to 'confirmed' for free workshops
UPDATE public.workshop_registrations
SET status = 'confirmed'
WHERE status = 'registered';

-- For registrations on paid workshops that were 'registered', set to awaiting_payment
UPDATE public.workshop_registrations wr
SET status = 'awaiting_payment', payment_status = 'awaiting'
FROM public.workshops w
WHERE wr.workshop_id = w.id
  AND w.fee > 0
  AND wr.status = 'confirmed';

-- Set payment_status for confirmed free workshops
UPDATE public.workshop_registrations
SET payment_status = 'verified'
WHERE status = 'confirmed'
  AND payment_status = 'none';

-- ============================================================
-- Drop old status CHECK and recreate with expanded statuses
-- ============================================================
ALTER TABLE public.workshop_registrations
  DROP CONSTRAINT IF EXISTS workshop_registrations_status_check;

ALTER TABLE public.workshop_registrations
  ADD CONSTRAINT workshop_registrations_status_check
    CHECK (status IN (
      'pending', 'awaiting_payment', 'payment_submitted', 'payment_under_review',
      'confirmed', 'waitlisted', 'cancelled', 'attended', 'no_show', 'completed'
    ));

-- ============================================================
-- ALTER: drop old payment_order_id column (no longer needed)
-- ============================================================
ALTER TABLE public.workshop_registrations
  DROP COLUMN IF EXISTS payment_order_id;

-- ============================================================
-- UPDATE: seat trigger to count awaiting_payment toward capacity
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_workshop_seats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  confirmed_count INTEGER;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT COUNT(*) INTO confirmed_count
    FROM public.workshop_registrations
    WHERE workshop_id = COALESCE(NEW.workshop_id, OLD.workshop_id)
      AND status IN ('confirmed', 'attended', 'awaiting_payment', 'payment_submitted', 'payment_under_review');
    
    UPDATE public.workshops
    SET seats_remaining = GREATEST(0, COALESCE(max_seats, 0) - confirmed_count)
    WHERE id = COALESCE(NEW.workshop_id, OLD.workshop_id);
  ELSIF TG_OP = 'DELETE' THEN
    SELECT COUNT(*) INTO confirmed_count
    FROM public.workshop_registrations
    WHERE workshop_id = OLD.workshop_id
      AND status IN ('confirmed', 'attended', 'awaiting_payment', 'payment_submitted', 'payment_under_review');
    
    UPDATE public.workshops
    SET seats_remaining = GREATEST(0, COALESCE(max_seats, 0) - confirmed_count)
    WHERE id = OLD.workshop_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- TABLE: admin_notifications
-- ============================================================
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX idx_admin_notifications_created ON public.admin_notifications(created_at DESC);

-- ============================================================
-- RLS POLICIES — workshop_payments
-- ============================================================
ALTER TABLE public.workshop_payments ENABLE ROW LEVEL SECURITY;

-- Users can view payments for their own registrations
CREATE POLICY "workshop_payments_select_own" ON public.workshop_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workshop_registrations
      WHERE workshop_registrations.id = workshop_payments.registration_id
        AND workshop_registrations.user_id = auth.uid()
    )
  );

-- Guests can view payments for their registrations by email
CREATE POLICY "workshop_payments_select_guest" ON public.workshop_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workshop_registrations
      WHERE workshop_registrations.id = workshop_payments.registration_id
        AND workshop_registrations.guest_email IS NOT NULL
        AND workshop_registrations.guest_email = (auth.jwt() ->> 'email')
    )
  );

-- Admin can view all payments
CREATE POLICY "workshop_payments_select_admin" ON public.workshop_payments
  FOR SELECT USING (public.is_admin());

-- Users can insert payments for their own registrations
CREATE POLICY "workshop_payments_insert_own" ON public.workshop_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workshop_registrations
      WHERE workshop_registrations.id = workshop_payments.registration_id
        AND workshop_registrations.user_id = auth.uid()
    )
  );

-- Guests can insert payments for their registrations
CREATE POLICY "workshop_payments_insert_guest" ON public.workshop_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workshop_registrations
      WHERE workshop_registrations.id = workshop_payments.registration_id
        AND workshop_registrations.user_id IS NULL
        AND workshop_registrations.guest_email IS NOT NULL
    )
  );

-- Admin can update all payments
CREATE POLICY "workshop_payments_update_admin" ON public.workshop_payments
  FOR UPDATE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — admin_notifications
-- ============================================================
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_notifications_select_admin" ON public.admin_notifications
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admin_notifications_insert_admin" ON public.admin_notifications
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "admin_notifications_update_admin" ON public.admin_notifications
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "admin_notifications_delete_admin" ON public.admin_notifications
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- Storage: allow guests to upload payment proofs
-- ============================================================
-- The existing payment-proofs bucket policy allows authenticated users.
-- We need to also allow anonymous uploads for guest registrations.
-- Add a policy for anonymous uploads to payment-proofs bucket.
CREATE POLICY "payment_proofs_insert_anon" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs' AND auth.role() = 'anon'
  );
