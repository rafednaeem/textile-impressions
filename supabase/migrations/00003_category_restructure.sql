-- ============================================================
-- TEXTILE IMPRESSION — Category Restructure Migration
-- ============================================================

-- Clear existing categories and re-seed with new taxonomy
TRUNCATE public.categories RESTART IDENTITY CASCADE;

-- Parent categories
INSERT INTO public.categories (id, name, slug, description, sort_order, is_active) VALUES
  (gen_random_uuid(), 'Textile Products', 'textile-products', 'All textile products', 1, TRUE),
  (gen_random_uuid(), 'Sustainable Colors & Paints', 'sustainable-colors', 'Natural dyes, paints, and pigments', 2, TRUE);

-- Get parent IDs for subcategories
DO $$
DECLARE
  textile_parent UUID;
  colors_parent UUID;
BEGIN
  SELECT id INTO textile_parent FROM public.categories WHERE slug = 'textile-products';
  SELECT id INTO colors_parent FROM public.categories WHERE slug = 'sustainable-colors';

  -- Textile Products subcategories
  INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active) VALUES
    (gen_random_uuid(), 'Ready to Print or Dye', 'ready-to-print-dye', 'Fabric ready for printing or dyeing', textile_parent, 1, TRUE),
    (gen_random_uuid(), 'Finished Products', 'finished-products', 'Ready-to-wear and finished textile products', textile_parent, 2, TRUE),
    (gen_random_uuid(), 'Customized Products', 'customized-products', 'Custom order requests', textile_parent, 3, TRUE);

  -- Sustainable Colors & Paints subcategories
  INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active) VALUES
    (gen_random_uuid(), 'Natural Dyes', 'natural-dyes', 'Botanical and natural dyes', colors_parent, 1, TRUE),
    (gen_random_uuid(), 'Block Printing Paints', 'block-printing-paints', 'Paints for block printing', colors_parent, 2, TRUE),
    (gen_random_uuid(), 'Fabric Paints', 'fabric-paints', 'Fabric paints and pigments', colors_parent, 3, TRUE);
END $$;

-- Add estimated_delivery_time to orders table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS estimated_delivery_time TEXT;

-- Update payments table enum to only include bank_transfer and cod
-- Note: This requires recreating the check constraint
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_method_check 
  CHECK (method IN ('bank_transfer', 'cod'));

-- Add order status values for COD flow
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'pending', 'payment_pending', 'payment_submitted',
    'payment_verified', 'processing', 'shipped',
    'delivered', 'cancelled', 'cod_pending', 'dispatched'
  ));

-- Update order_timeline status constraint
ALTER TABLE public.order_timeline DROP CONSTRAINT IF EXISTS order_timeline_status_check;
ALTER TABLE public.order_timeline ADD CONSTRAINT order_timeline_status_check 
  CHECK (status IN (
    'pending', 'payment_pending', 'payment_submitted',
    'payment_verified', 'processing', 'shipped',
    'delivered', 'cancelled', 'cod_pending', 'dispatched'
  ));