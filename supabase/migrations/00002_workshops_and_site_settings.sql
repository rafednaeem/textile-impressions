-- ============================================================
-- TEXTILE IMPRESSION — Workshops & Site Settings Migration
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: workshops
-- ============================================================
CREATE TABLE public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  instructor_name TEXT NOT NULL DEFAULT 'Textile Impression',
  cover_image_url TEXT,
  format TEXT NOT NULL CHECK (format IN ('in_person','online','hybrid')),
  level TEXT NOT NULL CHECK (level IN ('beginner','intermediate','advanced','all_levels')) DEFAULT 'all_levels',
  date_start TIMESTAMPTZ,
  date_end TIMESTAMPTZ,
  duration_minutes INTEGER,
  location_address TEXT,
  online_meeting_platform TEXT CHECK (online_meeting_platform IN ('zoom','google_meet','teams','other')),
  online_meeting_id TEXT,
  online_meeting_url TEXT,
  max_seats INTEGER,
  seats_remaining INTEGER,
  fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  materials_included BOOLEAN NOT NULL DEFAULT FALSE,
  materials_list TEXT,
  kit_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  recording_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft','published','completed','cancelled')) DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workshops_slug ON public.workshops(slug);
CREATE INDEX idx_workshops_status ON public.workshops(status);
CREATE INDEX idx_workshops_format ON public.workshops(format);
CREATE INDEX idx_workshops_date_start ON public.workshops(date_start);
CREATE INDEX idx_workshops_featured ON public.workshops(is_featured);

-- ============================================================
-- TABLE: workshop_registrations
-- ============================================================
CREATE TABLE public.workshop_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  payment_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('registered','waitlisted','cancelled','attended')) DEFAULT 'registered',
  meeting_link_sent BOOLEAN NOT NULL DEFAULT FALSE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workshop_registrations_workshop ON public.workshop_registrations(workshop_id);
CREATE INDEX idx_workshop_registrations_user ON public.workshop_registrations(user_id);
CREATE INDEX idx_workshop_registrations_status ON public.workshop_registrations(status);

-- ============================================================
-- TABLE: site_settings
-- ============================================================
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES — workshops
-- ============================================================
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

-- Public can read published workshops
CREATE POLICY "workshops_select_public" ON public.workshops
  FOR SELECT USING (status = 'published');

-- Admin can read all workshops
CREATE POLICY "workshops_select_admin" ON public.workshops
  FOR SELECT USING (public.is_admin());

-- Admin can insert workshops
CREATE POLICY "workshops_insert_admin" ON public.workshops
  FOR INSERT WITH CHECK (public.is_admin());

-- Admin can update workshops
CREATE POLICY "workshops_update_admin" ON public.workshops
  FOR UPDATE USING (public.is_admin());

-- Admin can delete workshops
CREATE POLICY "workshops_delete_admin" ON public.workshops
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — workshop_registrations
-- ============================================================
ALTER TABLE public.workshop_registrations ENABLE ROW LEVEL SECURITY;

-- Users can read their own registrations
CREATE POLICY "workshop_registrations_select_own" ON public.workshop_registrations
  FOR SELECT USING (auth.uid() = user_id);

-- Guests can read their registrations by email (for meeting link access)
CREATE POLICY "workshop_registrations_select_guest" ON public.workshop_registrations
  FOR SELECT USING (
    guest_email IS NOT NULL AND 
    guest_email = (auth.jwt() ->> 'email')
  );

-- Admin can read all registrations
CREATE POLICY "workshop_registrations_select_admin" ON public.workshop_registrations
  FOR SELECT USING (public.is_admin());

-- Authenticated users can create registrations for themselves
CREATE POLICY "workshop_registrations_insert_user" ON public.workshop_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can create guest registrations
CREATE POLICY "workshop_registrations_insert_guest" ON public.workshop_registrations
  FOR INSERT WITH CHECK (
    user_id IS NULL AND guest_email IS NOT NULL
  );

-- Admin can update registrations
CREATE POLICY "workshop_registrations_update_admin" ON public.workshop_registrations
  FOR UPDATE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — site_settings
-- ============================================================
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read site settings
CREATE POLICY "site_settings_select_public" ON public.site_settings
  FOR SELECT USING (TRUE);

-- Admin can insert/update/delete
CREATE POLICY "site_settings_modify_admin" ON public.site_settings
  FOR ALL USING (public.is_admin());

-- ============================================================
-- TRIGGERS
-- ============================================================
-- Auto-update updated_at for workshops
CREATE OR REPLACE TRIGGER trg_workshops_updated_at
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at for site_settings
CREATE OR REPLACE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-calculate seats_remaining on registration insert/update
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
      AND status IN ('registered', 'attended');
    
    UPDATE public.workshops
    SET seats_remaining = GREATEST(0, COALESCE(max_seats, 0) - confirmed_count)
    WHERE id = COALESCE(NEW.workshop_id, OLD.workshop_id);
  ELSIF TG_OP = 'DELETE' THEN
    SELECT COUNT(*) INTO confirmed_count
    FROM public.workshop_registrations
    WHERE workshop_id = OLD.workshop_id
      AND status IN ('registered', 'attended');
    
    UPDATE public.workshops
    SET seats_remaining = GREATEST(0, COALESCE(max_seats, 0) - confirmed_count)
    WHERE id = OLD.workshop_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_update_workshop_seats
  AFTER INSERT OR UPDATE OR DELETE ON public.workshop_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workshop_seats();

-- ============================================================
-- INITIAL SITE SETTINGS
-- ============================================================
INSERT INTO public.site_settings (key, value) VALUES
  ('products_crafted_count', '500'),
  ('store_whatsapp', '923001234567'),
  ('support_hours', 'Mon-Fri 9AM-6PM PKT'),
  ('bank_name', 'Meezan Bank'),
  ('bank_account', '1234567890'),
  ('bank_iban', 'PK36MEZN0001234567890'),
  ('delivery_policy_text', 'Standard delivery 3-5 business days. COD available in major cities.')
ON CONFLICT (key) DO NOTHING;