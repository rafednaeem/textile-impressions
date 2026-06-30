-- Remove NOT NULL constraint and UNIQUE constraint from SKU column
-- SKU is no longer required for product management

ALTER TABLE public.products ALTER COLUMN sku DROP NOT NULL;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_sku_key;
