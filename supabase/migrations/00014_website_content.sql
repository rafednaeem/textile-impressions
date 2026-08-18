-- ============================================================
-- WEBSITE CONTENT MODULE
-- Simple page/section/field content store for customer-facing text
-- and About-page image URLs.
-- ============================================================

-- ============================================================
-- TABLE: website_content
-- ============================================================
CREATE TABLE public.website_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  section TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (page, section, field)
);

CREATE INDEX idx_website_content_page ON public.website_content(page);
CREATE INDEX idx_website_content_section ON public.website_content(section);
CREATE INDEX idx_website_content_field ON public.website_content(field);

-- ============================================================
-- RLS POLICIES — website_content
-- ============================================================
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "website_content_select_public" ON public.website_content
  FOR SELECT USING (TRUE);

CREATE POLICY "website_content_modify_admin" ON public.website_content
  FOR ALL USING (public.is_admin());

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE TRIGGER trg_website_content_updated_at
  BEFORE UPDATE ON public.website_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- STORAGE BUCKET: website-content
-- Public read, admin write
-- ============================================================
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('website-content', 'website-content', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "website_content_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'website-content');

CREATE POLICY "website_content_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'website-content' AND public.is_admin());

CREATE POLICY "website_content_update_admin" ON storage.objects
  FOR UPDATE USING (bucket_id = 'website-content' AND public.is_admin());

CREATE POLICY "website_content_delete_admin" ON storage.objects
  FOR DELETE USING (bucket_id = 'website-content' AND public.is_admin());
