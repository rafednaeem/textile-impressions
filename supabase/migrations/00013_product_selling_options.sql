-- ============================================================
-- PRODUCT SELLING OPTIONS
-- Add pricing / WhatsApp inquiry toggles to products.
-- Existing products keep pricing enabled and WhatsApp disabled,
-- so they remain valid and continue to work exactly as before.
-- ============================================================

-- Add the two new flag columns with safe defaults.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS pricing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS whatsapp_inquiry_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: every existing product should remain a priced product
-- (the previous behaviour) and not switch to inquiry-only.
UPDATE public.products
SET pricing_enabled = TRUE,
    whatsapp_inquiry_enabled = FALSE
WHERE pricing_enabled IS NULL
   OR whatsapp_inquiry_enabled IS NULL;

-- Allow price to be NULL so inquiry-only products do not need a fake price.
ALTER TABLE public.products
  ALTER COLUMN price DROP NOT NULL;

-- Make sure at least one selling option is always enabled at the DB level.
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS product_selling_option_check;

ALTER TABLE public.products
  ADD CONSTRAINT product_selling_option_check
  CHECK (pricing_enabled = TRUE OR whatsapp_inquiry_enabled = TRUE);

-- Indexes for the new filters.
CREATE INDEX IF NOT EXISTS idx_products_pricing_enabled ON public.products(pricing_enabled);
CREATE INDEX IF NOT EXISTS idx_products_whatsapp_inquiry_enabled ON public.products(whatsapp_inquiry_enabled);
