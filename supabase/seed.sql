-- ============================================================
-- TEXTILE IMPRESSIONS — Seed Data
-- ============================================================
-- Run AFTER the migration. Creates admin user, categories, products.
-- ============================================================

DO $$
DECLARE
  v_admin_id UUID;
  v_cat_textile UUID;
  v_cat_colors UUID;
  v_cat_finished UUID;
  v_cat_ready UUID;
  v_cat_custom UUID;
  v_cat_natural UUID;
  v_cat_block UUID;
  v_cat_fabric UUID;
  v_prod_1 UUID; v_prod_2 UUID; v_prod_3 UUID;
  v_prod_4 UUID; v_prod_5 UUID; v_prod_6 UUID;
  v_prod_7 UUID; v_prod_8 UUID; v_prod_9 UUID; v_prod_10 UUID;
BEGIN

-- ============================================================
-- ADMIN USER
-- ============================================================
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@store.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  jsonb_build_object(
    'provider', 'email',
    'providers', ARRAY['email'],
    'role', 'admin'
  ),
  jsonb_build_object('full_name', 'Admin User'),
  NOW(),
  NOW()
)
RETURNING id INTO v_admin_id;

-- Update the auto-created profile to admin role
UPDATE public.profiles
SET
  role = 'admin',
  full_name = 'Admin User',
  phone = '0300-1234567'
WHERE id = v_admin_id;

-- ============================================================
-- CATEGORIES (hierarchical: parent > subcategories)
-- ============================================================

-- Parent: Textile Products
INSERT INTO public.categories (id, name, slug, description, sort_order, is_active)
VALUES (gen_random_uuid(), 'Textile Products', 'textile-products', 'All textile products', 1, TRUE)
RETURNING id INTO v_cat_textile;

-- Parent: Sustainable Colors & Paints
INSERT INTO public.categories (id, name, slug, description, sort_order, is_active)
VALUES (gen_random_uuid(), 'Sustainable Colors & Paints', 'sustainable-colors', 'Natural dyes, paints, and pigments', 2, TRUE)
RETURNING id INTO v_cat_colors;

-- Subcategory: Finished Products (under Textile Products)
INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
VALUES (gen_random_uuid(), 'Finished Products', 'finished-products', 'Ready-to-wear and finished textile products', v_cat_textile, 1, TRUE)
RETURNING id INTO v_cat_finished;

-- Subcategory: Ready to Print or Dye (under Textile Products)
INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
VALUES (gen_random_uuid(), 'Ready to Print or Dye', 'ready-to-print-dye', 'Fabric ready for printing or dyeing', v_cat_textile, 2, TRUE)
RETURNING id INTO v_cat_ready;

-- Subcategory: Customized Products (under Textile Products)
INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
VALUES (gen_random_uuid(), 'Customized Products', 'customized-products', 'Custom order requests', v_cat_textile, 3, TRUE)
RETURNING id INTO v_cat_custom;

-- Subcategory: Natural Dyes (under Sustainable Colors)
INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
VALUES (gen_random_uuid(), 'Natural Dyes', 'natural-dyes', 'Botanical and natural dyes', v_cat_colors, 1, TRUE)
RETURNING id INTO v_cat_natural;

-- Subcategory: Block Printing Paints (under Sustainable Colors)
INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
VALUES (gen_random_uuid(), 'Block Printing Paints', 'block-printing-paints', 'Paints for block printing', v_cat_colors, 2, TRUE)
RETURNING id INTO v_cat_block;

-- Subcategory: Fabric Paints (under Sustainable Colors)
INSERT INTO public.categories (id, name, slug, description, parent_id, sort_order, is_active)
VALUES (gen_random_uuid(), 'Fabric Paints', 'fabric-paints', 'Fabric paints and pigments', v_cat_colors, 3, TRUE)
RETURNING id INTO v_cat_fabric;

-- ============================================================
-- PRODUCTS — Kurtas
-- ============================================================

-- Product 1: Hand-Embroidered Khaddar Kurta
INSERT INTO public.products (id, name, slug, description, short_description, price, sale_price, sku, inventory_count, is_active, is_featured, category_id, tags, fabric, care_instructions)
VALUES (
  gen_random_uuid(),
  'Hand-Embroidered Khaddar Kurta',
  'hand-embroidered-khaddar-kurta',
  'Premium hand-embroidered kurta made from finest Khaddar fabric. Features intricate thread work on neckline and cuffs. Perfect for casual and semi-formal occasions. Available in multiple colors.',
  'Premium Khaddar kurta with hand-embroidered neckline and cuffs.',
  4500.00, 3800.00,
  'KRT-001', 50, TRUE, TRUE, v_cat_finished,
  ARRAY['hand-embroidered', 'khaddar', 'casual', 'premium'],
  'Khaddar (Cotton Blend)',
  'Dry clean recommended. Do not bleach. Iron on medium heat.'
) RETURNING id INTO v_prod_1;

INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  (v_prod_1, 'https://picsum.photos/seed/kurta1a/600/800', 'Khaddar Kurta Front View', 1, TRUE),
  (v_prod_1, 'https://picsum.photos/seed/kurta1b/600/800', 'Khaddar Kurta Back View', 2, FALSE),
  (v_prod_1, 'https://picsum.photos/seed/kurta1c/600/800', 'Khaddar Kurta Detail', 3, FALSE);

INSERT INTO public.product_variants (product_id, size, color, inventory_count, sku_suffix) VALUES
  (v_prod_1, 'S', 'Black', 10, 'BLK-S'),
  (v_prod_1, 'M', 'Black', 15, 'BLK-M'),
  (v_prod_1, 'L', 'Black', 12, 'BLK-L'),
  (v_prod_1, 'XL', 'Black', 8, 'BLK-XL'),
  (v_prod_1, 'S', 'White', 10, 'WHT-S'),
  (v_prod_1, 'M', 'White', 15, 'WHT-M'),
  (v_prod_1, 'L', 'White', 12, 'WHT-L'),
  (v_prod_1, 'XL', 'White', 8, 'WHT-XL'),
  (v_prod_1, 'M', 'Navy', 10, 'NAV-M'),
  (v_prod_1, 'L', 'Navy', 8, 'NAV-L');

-- Product 2: Digital Printed Lawn Kurta
INSERT INTO public.products (id, name, slug, description, short_description, price, sku, inventory_count, is_active, is_featured, category_id, tags, fabric, care_instructions)
VALUES (
  gen_random_uuid(),
  'Digital Printed Lawn Kurta',
  'digital-printed-lawn-kurta',
  'Lightweight and breathable lawn kurta with vibrant digital prints. Features modern cuts with traditional motifs. Ideal for summer wear.',
  'Breathable lawn kurta with vibrant digital prints.',
  3500.00,
  'KRT-002', 40, TRUE, TRUE, v_cat_finished,
  ARRAY['digital-print', 'lawn', 'summer', 'casual'],
  'Lawn (Cotton)',
  'Machine wash gentle cycle. Wash separately. Do not wring.'
) RETURNING id INTO v_prod_2;

INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  (v_prod_2, 'https://picsum.photos/seed/kurta2a/600/800', 'Lawn Kurta Front', 1, TRUE),
  (v_prod_2, 'https://picsum.photos/seed/kurta2b/600/800', 'Lawn Kurta Detail', 2, FALSE);

INSERT INTO public.product_variants (product_id, size, color, inventory_count, sku_suffix) VALUES
  (v_prod_2, 'S', 'Red', 8, 'RED-S'),
  (v_prod_2, 'M', 'Red', 12, 'RED-M'),
  (v_prod_2, 'L', 'Red', 10, 'RED-L'),
  (v_prod_2, 'XL', 'Red', 5, 'RED-XL'),
  (v_prod_2, 'M', 'Blue', 10, 'BLU-M'),
  (v_prod_2, 'L', 'Blue', 8, 'BLU-L'),
  (v_prod_2, 'M', 'Green', 8, 'GRN-M'),
  (v_prod_2, 'L', 'Green', 6, 'GRN-L');

-- Product 3: Heavy Embroidered Chiffon Dupatta
INSERT INTO public.products (id, name, slug, description, short_description, price, sale_price, sku, inventory_count, is_active, is_featured, category_id, tags, fabric, care_instructions)
VALUES (
  gen_random_uuid(),
  'Heavy Embroidered Chiffon Dupatta',
  'heavy-embroidered-chiffon-dupatta',
  'Luxurious chiffon dupatta with heavy hand-embroidery on borders and pallu. Features delicate resham and mirror work. Perfect for weddings and formal events.',
  'Luxurious chiffon dupatta with hand-embroidered borders.',
  8500.00, 7200.00,
  'DUP-001', 25, TRUE, TRUE, v_cat_finished,
  ARRAY['hand-embroidered', 'chiffon', 'formal', 'wedding'],
  'Chiffon (Polyester Blend)',
  'Dry clean only. Store in muslin cloth. Avoid direct sunlight.'
) RETURNING id INTO v_prod_3;

INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  (v_prod_3, 'https://picsum.photos/seed/dupatta1a/600/800', 'Embroidered Dupatta Full', 1, TRUE),
  (v_prod_3, 'https://picsum.photos/seed/dupatta1b/600/800', 'Embroidered Dupatta Border Detail', 2, FALSE),
  (v_prod_3, 'https://picsum.photos/seed/dupatta1c/600/800', 'Embroidered Dupatta Pallu', 3, FALSE);

INSERT INTO public.product_variants (product_id, size, color, inventory_count, sku_suffix) VALUES
  (v_prod_3, NULL, 'Red Gold', 8, 'RDGLD'),
  (v_prod_3, NULL, 'Teal Silver', 6, 'TLSIL'),
  (v_prod_3, NULL, 'Bottle Green Gold', 5, 'BTGGLD'),
  (v_prod_3, NULL, 'Maroon Gold', 6, 'MRNGLD');

-- Product 4: Organza Digital Print Dupatta
INSERT INTO public.products (id, name, slug, description, short_description, price, sku, inventory_count, is_active, is_featured, category_id, tags, fabric, care_instructions)
VALUES (
  gen_random_uuid(),
  'Organza Digital Print Dupatta',
  'organza-digital-print-dupatta',
  'Crisp organza dupatta with vibrant digital prints. Lightweight yet elegant. Features finished borders on all sides.',
  'Crisp organza dupatta with vibrant digital prints.',
  5500.00,
  'DUP-002', 30, TRUE, FALSE, v_cat_finished,
  ARRAY['digital-print', 'organza', 'casual', 'summer'],
  'Organza (Polyester)',
  'Hand wash cold. Iron on low heat. Do not bleach.'
) RETURNING id INTO v_prod_4;

INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  (v_prod_4, 'https://picsum.photos/seed/dupatta2a/600/800', 'Organza Dupatta Front', 1, TRUE),
  (v_prod_4, 'https://picsum.photos/seed/dupatta2b/600/800', 'Organza Dupatta Pattern', 2, FALSE);

INSERT INTO public.product_variants (product_id, size, color, inventory_count, sku_suffix) VALUES
  (v_prod_4, NULL, 'Pastel Pink', 8, 'PINK'),
  (v_prod_4, NULL, 'Mint Green', 7, 'MINT'),
  (v_prod_4, NULL, 'Lavender', 6, 'LAV'),
  (v_prod_4, NULL, 'Sky Blue', 9, 'SKY');

-- Product 5: Three-Piece Cotton Suit (Shirt + Dupatta + Trouser)
INSERT INTO public.products (id, name, slug, description, short_description, price, sku, inventory_count, is_active, is_featured, category_id, tags, fabric, care_instructions)
VALUES (
  gen_random_uuid(),
  'Three-Piece Cotton Embroidered Suit',
  'three-piece-cotton-embroidered-suit',
  'Complete three-piece ensemble featuring embroidered shirt, matching dupatta, and dyed trouser. Hand-embroidery on neckline, sleeves, and dupatta border. Comfortable for all-day wear.',
  'Complete three-piece cotton suit with hand embroidery.',
  12000.00,
  'SUIT-001', 20, TRUE, TRUE, v_cat_finished,
  ARRAY['hand-embroidered', 'cotton', 'three-piece', 'formal'],
  'Cotton (Shirt), Cotton Silk (Dupatta)',
  'Dry clean recommended. Iron while slightly damp.'
) RETURNING id INTO v_prod_5;

INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  (v_prod_5, 'https://picsum.photos/seed/suit1a/600/800', 'Three-Piece Suit Full', 1, TRUE),
  (v_prod_5, 'https://picsum.photos/seed/suit1b/600/800', 'Suit Embroidery Detail', 2, FALSE),
  (v_prod_5, 'https://picsum.photos/seed/suit1c/600/800', 'Suit Dupatta', 3, FALSE);

INSERT INTO public.product_variants (product_id, size, color, inventory_count, sku_suffix) VALUES
  (v_prod_5, 'S', 'Moss Green', 4, 'MGRN-S'),
  (v_prod_5, 'M', 'Moss Green', 6, 'MGRN-M'),
  (v_prod_5, 'L', 'Moss Green', 5, 'MGRN-L'),
  (v_prod_5, 'XL', 'Moss Green', 3, 'MGRN-XL'),
  (v_prod_5, 'M', 'Dusty Rose', 5, 'DROS-M'),
  (v_prod_5, 'L', 'Dusty Rose', 4, 'DROS-L');

-- Product 6: Luxury Pret Stitched Suit
INSERT INTO public.products (id, name, slug, description, short_description, price, sale_price, sku, inventory_count, is_active, is_featured, category_id, tags, fabric, care_instructions)
VALUES (
  gen_random_uuid(),
  'Luxury Pret Stitched Organza Suit',
  'luxury-pret-stitched-organza-suit',
  'Ready-to-wear luxury stitched suit in premium organza. Features delicate badla and dabka hand-embroidery. Fully lined and ready to wear straight out of the package.',
  'Ready-to-wear organza suit with hand-embroidery.',
  18000.00, 15000.00,
  'SUIT-002', 15, TRUE, TRUE, v_cat_finished,
  ARRAY['hand-embroidered', 'organza', 'pret', 'luxury'],
  'Organza, Lining: Cotton',
  'Dry clean only. Store in garment bag.'
) RETURNING id INTO v_prod_6;

INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  (v_prod_6, 'https://picsum.photos/seed/suit2a/600/800', 'Luxury Suit Front', 1, TRUE),
  (v_prod_6, 'https://picsum.photos/seed/suit2b/600/800', 'Luxury Suit Back', 2, FALSE),
  (v_prod_6, 'https://picsum.photos/seed/suit2c/600/800', 'Luxury Suit Embroidery', 3, FALSE);

INSERT INTO public.product_variants (product_id, size, color, inventory_count, sku_suffix) VALUES
  (v_prod_6, 'S', 'Champagne Gold', 3, 'CHMP-S'),
  (v_prod_6, 'M', 'Champagne Gold', 5, 'CHMP-M'),
  (v_prod_6, 'L', 'Champagne Gold', 4, 'CHMP-L'),
  (v_prod_6, 'S', 'Ivory Silver', 3, 'IVRY-S'),
  (v_prod_6, 'M', 'Ivory Silver', 4, 'IVRY-M'),
  (v_prod_6, 'L', 'Ivory Silver', 3, 'IVRY-L');

-- Product 7: Printed Co-ord Set
INSERT INTO public.products (id, name, slug, description, short_description, price, sku, inventory_count, is_active, is_featured, category_id, tags, fabric, care_instructions)
VALUES (
  gen_random_uuid(),
  'Digital Print Co-ord Set',
  'digital-print-co-ord-set',
  'Trendy co-ord set featuring a cropped top and straight trousers with matching digital print. Elasticated waist for comfort. Perfect for casual outings and events.',
  'Trendy printed top and trouser co-ord set.',
  7500.00,
  'CRD-001', 30, TRUE, TRUE, v_cat_finished,
  ARRAY['digital-print', 'co-ord', 'casual', 'trendy'],
  'Viscose Crepe',
  'Hand wash cold. Do not bleach. Iron on low heat.'
) RETURNING id INTO v_prod_7;

INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  (v_prod_7, 'https://picsum.photos/seed/coord1a/600/800', 'Co-ord Set Full', 1, TRUE),
  (v_prod_7, 'https://picsum.photos/seed/coord1b/600/800', 'Co-ord Set Top Detail', 2, FALSE);

INSERT INTO public.product_variants (product_id, size, color, inventory_count, sku_suffix) VALUES
  (v_prod_7, 'S', 'Blue Abstract', 5, 'BLUA-S'),
  (v_prod_7, 'M', 'Blue Abstract', 8, 'BLUA-M'),
  (v_prod_7, 'L', 'Blue Abstract', 6, 'BLUA-L'),
  (v_prod_7, 'S', 'Pink Floral', 5, 'PKFL-S'),
  (v_prod_7, 'M', 'Pink Floral', 7, 'PKFL-M'),
  (v_prod_7, 'L', 'Pink Floral', 5, 'PKFL-L');

-- Product 8: Embroidered Co-ord Set
INSERT INTO public.products (id, name, slug, description, short_description, price, sku, inventory_count, is_active, is_featured, category_id, tags, fabric, care_instructions)
VALUES (
  gen_random_uuid(),
  'Hand-Embroidered Co-ord Set',
  'hand-embroidered-co-ord-set',
  'Elegant hand-embroidered co-ord set with matching straight pants. Thread work on neckline and sleeve hems. Comes with a matching dupatta.',
  'Elegant embroidered co-ord set with matching dupatta.',
  9500.00,
  'CRD-002', 20, TRUE, FALSE, v_cat_finished,
  ARRAY['hand-embroidered', 'co-ord', 'formal', 'elegant'],
  'Raw Silk, Lining: Cotton',
  'Dry clean recommended. Iron on reverse side.'
) RETURNING id INTO v_prod_8;

INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  (v_prod_8, 'https://picsum.photos/seed/coord2a/600/800', 'Embroidered Co-ord Front', 1, TRUE),
  (v_prod_8, 'https://picsum.photos/seed/coord2b/600/800', 'Embroidered Co-ord Detail', 2, FALSE);

INSERT INTO public.product_variants (product_id, size, color, inventory_count, sku_suffix) VALUES
  (v_prod_8, 'S', 'Emerald', 3, 'EMLD-S'),
  (v_prod_8, 'M', 'Emerald', 5, 'EMLD-M'),
  (v_prod_8, 'L', 'Emerald', 4, 'EMLD-L'),
  (v_prod_8, 'M', 'Royal Blue', 4, 'RBLU-M'),
  (v_prod_8, 'L', 'Royal Blue', 3, 'RBLU-L');

-- Product 9: Hand-Embroidered Clutch
INSERT INTO public.products (id, name, slug, description, short_description, price, sku, inventory_count, is_active, is_featured, category_id, tags, fabric, care_instructions)
VALUES (
  gen_random_uuid(),
  'Hand-Embroidered Silk Clutch',
  'hand-embroidered-silk-clutch',
  'Exquisite hand-embroidered clutch purse made from pure silk. Features intricate resham and pearl work with a magnetic closure. Lined interior with one pocket. Chain strap included.',
  'Exquisite hand-embroidered silk clutch with pearl work.',
  4500.00,
  'ACC-001', 35, TRUE, TRUE, v_cat_finished,
  ARRAY['hand-embroidered', 'clutch', 'silk', 'formal'],
  'Pure Silk, Lining: Velvet',
  'Spot clean only. Store in dust bag. Keep away from moisture.'
) RETURNING id INTO v_prod_9;

INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  (v_prod_9, 'https://picsum.photos/seed/clutch1a/600/800', 'Clutch Front', 1, TRUE),
  (v_prod_9, 'https://picsum.photos/seed/clutch1b/600/800', 'Clutch Interior', 2, FALSE);

INSERT INTO public.product_variants (product_id, size, color, inventory_count, sku_suffix) VALUES
  (v_prod_9, NULL, 'Gold', 8, 'GLD'),
  (v_prod_9, NULL, 'Silver', 7, 'SIL'),
  (v_prod_9, NULL, 'Rose Gold', 6, 'RSGLD');

-- Product 10: Handcrafted Khussa Shoes
INSERT INTO public.products (id, name, slug, description, short_description, price, sku, inventory_count, is_active, is_featured, category_id, tags, fabric, care_instructions)
VALUES (
  gen_random_uuid(),
  'Handcrafted Leather Khussa',
  'handcrafted-leather-khussa',
  'Traditional handcrafted khussa shoes made from genuine leather. Features hand-embroidered upper with resham and mirror work. Comfortable leather sole. True to size.',
  'Traditional handcrafted leather khussa with embroidery.',
  5500.00,
  'ACC-002', 40, TRUE, TRUE, v_cat_finished,
  ARRAY['handcrafted', 'khussa', 'leather', 'traditional'],
  'Genuine Leather Upper, Leather Sole',
  'Wipe with damp cloth. Use leather conditioner. Avoid water.'
) RETURNING id INTO v_prod_10;

INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  (v_prod_10, 'https://picsum.photos/seed/khussa1a/600/800', 'Khussa Pair', 1, TRUE),
  (v_prod_10, 'https://picsum.photos/seed/khussa1b/600/800', 'Khussa Top View', 2, FALSE),
  (v_prod_10, 'https://picsum.photos/seed/khussa1c/600/800', 'Khussa Embroidery Detail', 3, FALSE);

INSERT INTO public.product_variants (product_id, size, color, inventory_count, sku_suffix) VALUES
  (v_prod_10, '36', 'Red', 5, '36-RED'),
  (v_prod_10, '37', 'Red', 6, '37-RED'),
  (v_prod_10, '38', 'Red', 8, '38-RED'),
  (v_prod_10, '39', 'Red', 6, '39-RED'),
  (v_prod_10, '40', 'Red', 5, '40-RED'),
  (v_prod_10, '36', 'Black', 4, '36-BLK'),
  (v_prod_10, '37', 'Black', 5, '37-BLK'),
  (v_prod_10, '38', 'Black', 6, '38-BLK'),
  (v_prod_10, '39', 'Black', 5, '39-BLK'),
  (v_prod_10, '40', 'Black', 4, '40-BLK');

-- ============================================================
-- Verify seed data
-- ============================================================
RAISE NOTICE 'Seed complete: Admin ID = %', v_admin_id;
RAISE NOTICE 'Created 5 categories and 10 products';

END $$;
