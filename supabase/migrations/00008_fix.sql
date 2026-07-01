-- ============================================================
-- FINISH MIGRATION 00008 (run this after the first attempt errored)
-- This script uses IF NOT EXISTS / IF EXISTS guards so it's
-- safe to run even if some parts already succeeded.
-- ============================================================

-- 1. Create workshop_payments (skip if already exists)
CREATE TABLE IF NOT EXISTS public.workshop_payments (
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

CREATE INDEX IF NOT EXISTS idx_workshop_payments_registration ON public.workshop_payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_workshop_payments_status ON public.workshop_payments(status);

-- 2. Add new columns (IF NOT EXISTS so it's safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workshop_registrations' AND column_name='payment_status') THEN
    ALTER TABLE public.workshop_registrations ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'none';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workshop_registrations' AND column_name='admin_notes') THEN
    ALTER TABLE public.workshop_registrations ADD COLUMN admin_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workshop_registrations' AND column_name='cancelled_at') THEN
    ALTER TABLE public.workshop_registrations ADD COLUMN cancelled_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workshop_registrations' AND column_name='cancellation_reason') THEN
    ALTER TABLE public.workshop_registrations ADD COLUMN cancellation_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workshop_registrations' AND column_name='checked_in_at') THEN
    ALTER TABLE public.workshop_registrations ADD COLUMN checked_in_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workshop_registrations' AND column_name='waitlisted_at') THEN
    ALTER TABLE public.workshop_registrations ADD COLUMN waitlisted_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Migrate old data BEFORE adding the constraint
UPDATE public.workshop_registrations SET status = 'confirmed' WHERE status = 'registered';

UPDATE public.workshop_registrations wr
SET status = 'awaiting_payment', payment_status = 'awaiting'
FROM public.workshops w
WHERE wr.workshop_id = w.id AND w.fee > 0 AND wr.status = 'confirmed';

UPDATE public.workshop_registrations
SET payment_status = 'verified'
WHERE status = 'confirmed' AND payment_status = 'none';

-- 4. Drop old constraint and add new one
ALTER TABLE public.workshop_registrations DROP CONSTRAINT IF EXISTS workshop_registrations_status_check;

ALTER TABLE public.workshop_registrations
  ADD CONSTRAINT workshop_registrations_status_check
    CHECK (status IN (
      'pending','awaiting_payment','payment_submitted','payment_under_review',
      'confirmed','waitlisted','cancelled','attended','no_show','completed'
    ));

-- 5. Drop payment_order_id (skip if already gone)
ALTER TABLE public.workshop_registrations DROP COLUMN IF EXISTS payment_order_id;

-- 6. Update seat trigger
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
      AND status IN ('confirmed','attended','awaiting_payment','payment_submitted','payment_under_review');
    UPDATE public.workshops
    SET seats_remaining = GREATEST(0, COALESCE(max_seats, 0) - confirmed_count)
    WHERE id = COALESCE(NEW.workshop_id, OLD.workshop_id);
  ELSIF TG_OP = 'DELETE' THEN
    SELECT COUNT(*) INTO confirmed_count
    FROM public.workshop_registrations
    WHERE workshop_id = OLD.workshop_id
      AND status IN ('confirmed','attended','awaiting_payment','payment_submitted','payment_under_review');
    UPDATE public.workshops
    SET seats_remaining = GREATEST(0, COALESCE(max_seats, 0) - confirmed_count)
    WHERE id = OLD.workshop_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 7. Create admin_notifications (skip if exists)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON public.admin_notifications(created_at DESC);

-- 8. RLS policies (use IF NOT EXISTS where possible, otherwise drop+create)
ALTER TABLE public.workshop_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workshop_payments_select_own ON public.workshop_payments;
CREATE POLICY workshop_payments_select_own ON public.workshop_payments
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.workshop_registrations WHERE workshop_registrations.id = workshop_payments.registration_id AND workshop_registrations.user_id = auth.uid()));

DROP POLICY IF EXISTS workshop_payments_select_guest ON public.workshop_payments;
CREATE POLICY workshop_payments_select_guest ON public.workshop_payments
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.workshop_registrations WHERE workshop_registrations.id = workshop_payments.registration_id AND workshop_registrations.guest_email IS NOT NULL AND workshop_registrations.guest_email = (auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS workshop_payments_select_admin ON public.workshop_payments;
CREATE POLICY workshop_payments_select_admin ON public.workshop_payments
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS workshop_payments_insert_own ON public.workshop_payments;
CREATE POLICY workshop_payments_insert_own ON public.workshop_payments
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workshop_registrations WHERE workshop_registrations.id = workshop_payments.registration_id AND workshop_registrations.user_id = auth.uid()));

DROP POLICY IF EXISTS workshop_payments_insert_guest ON public.workshop_payments;
CREATE POLICY workshop_payments_insert_guest ON public.workshop_payments
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workshop_registrations WHERE workshop_registrations.id = workshop_payments.registration_id AND workshop_registrations.user_id IS NULL AND workshop_registrations.guest_email IS NOT NULL));

DROP POLICY IF EXISTS workshop_payments_update_admin ON public.workshop_payments;
CREATE POLICY workshop_payments_update_admin ON public.workshop_payments
  FOR UPDATE USING (public.is_admin());

-- 9. Admin notifications RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_notifications_select_admin ON public.admin_notifications;
CREATE POLICY admin_notifications_select_admin ON public.admin_notifications
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS admin_notifications_insert_admin ON public.admin_notifications;
CREATE POLICY admin_notifications_insert_admin ON public.admin_notifications
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_notifications_update_admin ON public.admin_notifications;
CREATE POLICY admin_notifications_update_admin ON public.admin_notifications
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS admin_notifications_delete_admin ON public.admin_notifications;
CREATE POLICY admin_notifications_delete_admin ON public.admin_notifications
  FOR DELETE USING (public.is_admin());

-- 10. Storage policy for guest payment uploads
DROP POLICY IF EXISTS payment_proofs_insert_anon ON storage.objects;
CREATE POLICY payment_proofs_insert_anon ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'anon');
