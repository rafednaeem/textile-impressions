-- ============================================================
-- PRODUCT VIDEOS
-- Extend product_images table to support both images and videos
-- without breaking existing products.
-- ============================================================

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Backfill created_at for existing rows that don't have it.
UPDATE public.product_images
SET created_at = NOW()
WHERE created_at IS NULL;

-- Existing image records automatically have media_type = 'image'.
-- No data migration is required; products with only images keep working.
