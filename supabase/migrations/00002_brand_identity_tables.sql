-- ============================================================
-- TEXTILE IMPRESSIONS - Brand identity and incubation tables
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS craft_type TEXT DEFAULT 'Plain';

CREATE INDEX IF NOT EXISTS idx_products_craft_type ON public.products(craft_type);

CREATE TABLE IF NOT EXISTS public.artisans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  craft TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT,
  bio TEXT NOT NULL,
  image_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artisans_featured ON public.artisans(is_featured);
CREATE INDEX IF NOT EXISTS idx_artisans_sort_order ON public.artisans(sort_order);

CREATE TABLE IF NOT EXISTS public.ugc_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_via TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ugc_photos_approved ON public.ugc_photos(is_approved);
CREATE INDEX IF NOT EXISTS idx_ugc_photos_product ON public.ugc_photos(product_id);

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  hero_image_url TEXT,
  season TEXT,
  year INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_published ON public.collections(is_published);

CREATE TABLE IF NOT EXISTS public.collection_products (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  editorial_note TEXT,
  PRIMARY KEY (collection_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_products_sort ON public.collection_products(collection_id, sort_order);

CREATE TABLE IF NOT EXISTS public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  garment_type TEXT NOT NULL,
  fabric_preference TEXT,
  color_preference TEXT,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  budget_range TEXT,
  deadline DATE,
  notes TEXT,
  reference_images TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON public.custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_created ON public.custom_orders(created_at DESC);

CREATE TABLE IF NOT EXISTS public.incubator_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  craft_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'accepted', 'rejected', 'contacted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incubator_enquiries_status ON public.incubator_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_incubator_enquiries_created ON public.incubator_enquiries(created_at DESC);

ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ugc_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incubator_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artisans_select_public" ON public.artisans
  FOR SELECT USING (TRUE);
CREATE POLICY "artisans_insert_admin" ON public.artisans
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "artisans_update_admin" ON public.artisans
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "artisans_delete_admin" ON public.artisans
  FOR DELETE USING (public.is_admin());

CREATE POLICY "ugc_photos_select_approved_public" ON public.ugc_photos
  FOR SELECT USING (is_approved = TRUE OR public.is_admin());
CREATE POLICY "ugc_photos_insert_admin" ON public.ugc_photos
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "ugc_photos_update_admin" ON public.ugc_photos
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "ugc_photos_delete_admin" ON public.ugc_photos
  FOR DELETE USING (public.is_admin());

CREATE POLICY "collections_select_published_public" ON public.collections
  FOR SELECT USING (is_published = TRUE OR public.is_admin());
CREATE POLICY "collections_insert_admin" ON public.collections
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "collections_update_admin" ON public.collections
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "collections_delete_admin" ON public.collections
  FOR DELETE USING (public.is_admin());

CREATE POLICY "collection_products_select_published_public" ON public.collection_products
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_products.collection_id
      AND collections.is_published = TRUE
    )
  );
CREATE POLICY "collection_products_insert_admin" ON public.collection_products
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "collection_products_update_admin" ON public.collection_products
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "collection_products_delete_admin" ON public.collection_products
  FOR DELETE USING (public.is_admin());

CREATE POLICY "custom_orders_insert_public" ON public.custom_orders
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "custom_orders_select_admin" ON public.custom_orders
  FOR SELECT USING (public.is_admin());
CREATE POLICY "custom_orders_update_admin" ON public.custom_orders
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "custom_orders_delete_admin" ON public.custom_orders
  FOR DELETE USING (public.is_admin());

CREATE POLICY "incubator_enquiries_insert_public" ON public.incubator_enquiries
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "incubator_enquiries_select_admin" ON public.incubator_enquiries
  FOR SELECT USING (public.is_admin());
CREATE POLICY "incubator_enquiries_update_admin" ON public.incubator_enquiries
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "incubator_enquiries_delete_admin" ON public.incubator_enquiries
  FOR DELETE USING (public.is_admin());

INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('custom-orders', 'custom-orders', FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "custom_orders_storage_insert_public" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'custom-orders');

CREATE POLICY "custom_orders_storage_select_admin" ON storage.objects
  FOR SELECT USING (bucket_id = 'custom-orders' AND public.is_admin());

CREATE POLICY "custom_orders_storage_update_admin" ON storage.objects
  FOR UPDATE USING (bucket_id = 'custom-orders' AND public.is_admin());

CREATE POLICY "custom_orders_storage_delete_admin" ON storage.objects
  FOR DELETE USING (bucket_id = 'custom-orders' AND public.is_admin());
