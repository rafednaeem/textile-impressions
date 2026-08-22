-- ============================================================
-- SCREEN PRINTING CATEGORY
-- Add 'Screen Printing' subcategory under Sustainable Colors & Paints
-- ============================================================

INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
SELECT gen_random_uuid(), 'Screen Printing', 'screen-printing', 'Screen printing inks, supplies and tools', colors.id, 4, TRUE
FROM public.categories colors
WHERE colors.slug = 'sustainable-colors'
  AND colors.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.categories c WHERE c.slug = 'screen-printing'
  );
