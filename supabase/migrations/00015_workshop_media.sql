-- ============================================================
-- WORKSHOP MEDIA
-- Videos (and optionally extra images) shown on workshop pages,
-- e.g. previews of the work that will be done in a workshop.
-- Mirrors the product_images media system.
-- ============================================================

CREATE TABLE public.workshop_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workshop_media_workshop ON public.workshop_media(workshop_id);

ALTER TABLE public.workshop_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workshop_media_select_public" ON public.workshop_media
  FOR SELECT USING (TRUE);

CREATE POLICY "workshop_media_insert_admin" ON public.workshop_media
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "workshop_media_update_admin" ON public.workshop_media
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "workshop_media_delete_admin" ON public.workshop_media
  FOR DELETE USING (public.is_admin());
