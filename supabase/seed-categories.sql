-- ============================================================
-- SEED: Categories for Textile Impressions
-- Run this in Supabase SQL Editor if migration 00003 hasn't been applied
-- ============================================================

-- Only insert if categories table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.categories LIMIT 1) THEN

    -- Parent: Textile Products
    INSERT INTO public.categories (id, name, slug, description, sort_order, is_active)
    VALUES (gen_random_uuid(), 'Textile Products', 'textile-products', 'All textile products', 1, TRUE);

    -- Parent: Sustainable Colors & Paints
    INSERT INTO public.categories (id, name, slug, description, sort_order, is_active)
    VALUES (gen_random_uuid(), 'Sustainable Colors & Paints', 'sustainable-colors', 'Natural dyes, paints, and pigments', 2, TRUE);

    -- Subcategories for Textile Products
    INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
    SELECT gen_random_uuid(), 'Ready to Print or Dye', 'ready-to-print-dye', 'Fabric ready for printing or dyeing', id, 1, TRUE
    FROM public.categories WHERE slug = 'textile-products';

    INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
    SELECT gen_random_uuid(), 'Finished Products', 'finished-products', 'Ready-to-wear and finished textile products', id, 2, TRUE
    FROM public.categories WHERE slug = 'textile-products';

    INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
    SELECT gen_random_uuid(), 'Customized Products', 'customized-products', 'Custom order requests', id, 3, TRUE
    FROM public.categories WHERE slug = 'textile-products';

    -- Subcategories for Sustainable Colors & Paints
    INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
    SELECT gen_random_uuid(), 'Natural Dyes', 'natural-dyes', 'Botanical and natural dyes', id, 1, TRUE
    FROM public.categories WHERE slug = 'sustainable-colors';

    INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
    SELECT gen_random_uuid(), 'Block Printing Paints', 'block-printing-paints', 'Paints for block printing', id, 2, TRUE
    FROM public.categories WHERE slug = 'sustainable-colors';

    INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
    SELECT gen_random_uuid(), 'Fabric Paints', 'fabric-paints', 'Fabric paints and pigments', id, 3, TRUE
    FROM public.categories WHERE slug = 'sustainable-colors';

    RAISE NOTICE 'Categories seeded successfully';

  ELSE
    RAISE NOTICE 'Categories already exist, skipping seed';
  END IF;
END $$;