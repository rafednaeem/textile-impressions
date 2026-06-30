-- ============================================================
-- TEXTILE IMPRESSIONS — Full Schema Bootstrap
-- ============================================================
-- This migration creates the entire schema from scratch.
-- Drops all existing tables first to handle partially-restored
-- databases that may be missing columns.

-- ============================================================
-- DROP EXISTING TABLES (reverse dependency order)
-- ============================================================
DROP TABLE IF EXISTS public.incubator_enquiries CASCADE;
DROP TABLE IF EXISTS public.custom_orders CASCADE;
DROP TABLE IF EXISTS public.collection_products CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;
DROP TABLE IF EXISTS public.ugc_photos CASCADE;
DROP TABLE IF EXISTS public.artisans CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.workshop_registrations CASCADE;
DROP TABLE IF EXISTS public.workshops CASCADE;
DROP TABLE IF EXISTS public.wishlists CASCADE;
DROP TABLE IF EXISTS public.discount_codes CASCADE;
DROP TABLE IF EXISTS public.order_timeline CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.carts CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SEQUENCES
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    FALSE
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE seq_num TEXT;
BEGIN
  seq_num := LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || seq_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TABLES (CREATE IF NOT EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  sale_price NUMERIC(10, 2),
  inventory_count INTEGER NOT NULL DEFAULT 0 CHECK (inventory_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  craft_type TEXT DEFAULT 'Plain',
  fabric TEXT,
  care_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  inventory_count INTEGER NOT NULL DEFAULT 0 CHECK (inventory_count >= 0),
  sku_suffix TEXT,
  UNIQUE(product_id, size, color)
);

CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cart_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time NUMERIC(10, 2) NOT NULL CHECK (price_at_time >= 0)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'payment_pending', 'payment_submitted',
    'payment_verified', 'processing', 'shipped',
    'delivered', 'cancelled', 'cod_pending', 'dispatched'
  )),
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  notes TEXT,
  estimated_delivery_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'cod')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'verified', 'rejected')),
  proof_url TEXT,
  proof_uploaded_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  transaction_reference TEXT
);

CREATE TABLE IF NOT EXISTS public.order_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'payment_pending', 'payment_submitted',
    'payment_verified', 'processing', 'shipped',
    'delivered', 'cancelled', 'cod_pending', 'dispatched'
  )),
  note TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC(10, 2) NOT NULL CHECK (value > 0),
  min_order_amount NUMERIC(10, 2),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  instructor_name TEXT NOT NULL DEFAULT 'Textile Impressions',
  cover_image_url TEXT,
  format TEXT NOT NULL CHECK (format IN ('in_person','online','hybrid')),
  level TEXT NOT NULL CHECK (level IN ('beginner','intermediate','advanced','all_levels')) DEFAULT 'all_levels',
  date_start TIMESTAMPTZ,
  date_end TIMESTAMPTZ,
  duration_minutes INTEGER,
  location_address TEXT,
  online_meeting_platform TEXT CHECK (online_meeting_platform IN ('zoom','google_meet','teams','other')),
  online_meeting_id TEXT,
  online_meeting_url TEXT,
  max_seats INTEGER,
  seats_remaining INTEGER,
  fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  materials_included BOOLEAN NOT NULL DEFAULT FALSE,
  materials_list TEXT,
  kit_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  recording_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft','published','completed','cancelled')) DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workshop_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  payment_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('registered','waitlisted','cancelled','attended')) DEFAULT 'registered',
  meeting_link_sent BOOLEAN NOT NULL DEFAULT FALSE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.ugc_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_via TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.collection_products (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  editorial_note TEXT,
  PRIMARY KEY (collection_id, product_id)
);

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

CREATE TABLE IF NOT EXISTS public.incubator_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  craft_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'accepted', 'rejected', 'contacted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_craft_type ON public.products(craft_type);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_order ON public.order_timeline(order_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_created ON public.order_timeline(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_workshops_slug ON public.workshops(slug);
CREATE INDEX IF NOT EXISTS idx_workshops_status ON public.workshops(status);
CREATE INDEX IF NOT EXISTS idx_workshops_format ON public.workshops(format);
CREATE INDEX IF NOT EXISTS idx_workshops_date_start ON public.workshops(date_start);
CREATE INDEX IF NOT EXISTS idx_workshops_featured ON public.workshops(is_featured);
CREATE INDEX IF NOT EXISTS idx_workshop_registrations_workshop ON public.workshop_registrations(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_registrations_user ON public.workshop_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_workshop_registrations_status ON public.workshop_registrations(status);
CREATE INDEX IF NOT EXISTS idx_artisans_featured ON public.artisans(is_featured);
CREATE INDEX IF NOT EXISTS idx_artisans_sort_order ON public.artisans(sort_order);
CREATE INDEX IF NOT EXISTS idx_ugc_photos_approved ON public.ugc_photos(is_approved);
CREATE INDEX IF NOT EXISTS idx_ugc_photos_product ON public.ugc_photos(product_id);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_published ON public.collections(is_published);
CREATE INDEX IF NOT EXISTS idx_collection_products_sort ON public.collection_products(collection_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON public.custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_created ON public.custom_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incubator_enquiries_status ON public.incubator_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_incubator_enquiries_created ON public.incubator_enquiries(created_at DESC);

-- Partial indexes (safe to re-run)
DROP INDEX IF EXISTS idx_carts_user;
CREATE UNIQUE INDEX idx_carts_user ON public.carts(user_id) WHERE user_id IS NOT NULL;
DROP INDEX IF EXISTS idx_carts_session;
CREATE INDEX idx_carts_session ON public.carts(session_id) WHERE session_id IS NOT NULL;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-generate order_number on insert
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.order_number := public.generate_order_number();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;
CREATE TRIGGER trg_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION public.set_order_number();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', SPLIT_PART(NEW.email, '@', 1)),
    'customer'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Sync profile role to JWT app_metadata
CREATE OR REPLACE FUNCTION public.sync_role_to_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_role_changed ON public.profiles;
CREATE TRIGGER on_profile_role_changed
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_to_metadata();

-- Auto-update updated_at timestamps
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_carts_updated_at ON public.carts;
CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_workshops_updated_at ON public.workshops;
CREATE TRIGGER trg_workshops_updated_at
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Workshop seat calculation
CREATE OR REPLACE FUNCTION public.update_workshop_seats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  confirmed_count INTEGER;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT COUNT(*) INTO confirmed_count
    FROM public.workshop_registrations
    WHERE workshop_id = COALESCE(NEW.workshop_id, OLD.workshop_id)
      AND status IN ('registered', 'attended');
    UPDATE public.workshops
    SET seats_remaining = GREATEST(0, COALESCE(max_seats, 0) - confirmed_count)
    WHERE id = COALESCE(NEW.workshop_id, OLD.workshop_id);
  ELSIF TG_OP = 'DELETE' THEN
    SELECT COUNT(*) INTO confirmed_count
    FROM public.workshop_registrations
    WHERE workshop_id = OLD.workshop_id
      AND status IN ('registered', 'attended');
    UPDATE public.workshops
    SET seats_remaining = GREATEST(0, COALESCE(max_seats, 0) - confirmed_count)
    WHERE id = OLD.workshop_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_workshop_seats ON public.workshop_registrations;
CREATE TRIGGER trg_update_workshop_seats
  AFTER INSERT OR UPDATE OR DELETE ON public.workshop_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workshop_seats();

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ugc_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incubator_enquiries ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES (use DO blocks to skip if already exists)
-- ============================================================

-- profiles
DO $$ BEGIN CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- categories
DO $$ BEGIN CREATE POLICY "categories_select_public" ON public.categories FOR SELECT USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "categories_insert_admin" ON public.categories FOR INSERT WITH CHECK (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "categories_update_admin" ON public.categories FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "categories_delete_admin" ON public.categories FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- products
DO $$ BEGIN CREATE POLICY "products_select_public" ON public.products FOR SELECT USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "products_insert_admin" ON public.products FOR INSERT WITH CHECK (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "products_update_admin" ON public.products FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "products_delete_admin" ON public.products FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- product_images
DO $$ BEGIN CREATE POLICY "product_images_select_public" ON public.product_images FOR SELECT USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "product_images_insert_admin" ON public.product_images FOR INSERT WITH CHECK (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "product_images_update_admin" ON public.product_images FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "product_images_delete_admin" ON public.product_images FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- product_variants
DO $$ BEGIN CREATE POLICY "product_variants_select_public" ON public.product_variants FOR SELECT USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "product_variants_insert_admin" ON public.product_variants FOR INSERT WITH CHECK (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "product_variants_update_admin" ON public.product_variants FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "product_variants_delete_admin" ON public.product_variants FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- addresses
DO $$ BEGIN CREATE POLICY "addresses_select_own" ON public.addresses FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addresses_insert_own" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addresses_update_own" ON public.addresses FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addresses_delete_own" ON public.addresses FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- carts
DO $$ BEGIN CREATE POLICY "carts_select_own" ON public.carts FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "carts_insert_own" ON public.carts FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "carts_update_own" ON public.carts FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "carts_delete_own" ON public.carts FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- cart_items
DO $$ BEGIN CREATE POLICY "cart_items_select_own" ON public.cart_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "cart_items_insert_own" ON public.cart_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "cart_items_update_own" ON public.cart_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "cart_items_delete_own" ON public.cart_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- orders
DO $$ BEGIN CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "orders_select_admin" ON public.orders FOR SELECT USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "orders_update_admin" ON public.orders FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- order_items
DO $$ BEGIN CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "order_items_select_admin" ON public.order_items FOR SELECT USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "order_items_insert_own" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "order_items_insert_admin" ON public.order_items FOR INSERT WITH CHECK (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "order_items_update_admin" ON public.order_items FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- payments
DO $$ BEGIN CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "payments_select_admin" ON public.payments FOR SELECT USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "payments_update_admin" ON public.payments FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- order_timeline
DO $$ BEGIN CREATE POLICY "order_timeline_select_own" ON public.order_timeline FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_timeline.order_id AND orders.user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "order_timeline_select_admin" ON public.order_timeline FOR SELECT USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "order_timeline_insert_admin" ON public.order_timeline FOR INSERT WITH CHECK (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- discount_codes
DO $$ BEGIN CREATE POLICY "discount_codes_select_admin" ON public.discount_codes FOR SELECT USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "discount_codes_insert_admin" ON public.discount_codes FOR INSERT WITH CHECK (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "discount_codes_update_admin" ON public.discount_codes FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "discount_codes_delete_admin" ON public.discount_codes FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- wishlists
DO $$ BEGIN CREATE POLICY "wishlists_select_own" ON public.wishlists FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "wishlists_insert_own" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "wishlists_delete_own" ON public.wishlists FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- workshops
DO $$ BEGIN CREATE POLICY "workshops_select_public" ON public.workshops FOR SELECT USING (status = 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "workshops_select_admin" ON public.workshops FOR SELECT USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "workshops_insert_admin" ON public.workshops FOR INSERT WITH CHECK (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "workshops_update_admin" ON public.workshops FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "workshops_delete_admin" ON public.workshops FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- workshop_registrations
DO $$ BEGIN CREATE POLICY "workshop_registrations_select_own" ON public.workshop_registrations FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "workshop_registrations_select_guest" ON public.workshop_registrations FOR SELECT USING (guest_email IS NOT NULL AND guest_email = (auth.jwt() ->> 'email')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "workshop_registrations_select_admin" ON public.workshop_registrations FOR SELECT USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "workshop_registrations_insert_user" ON public.workshop_registrations FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "workshop_registrations_insert_guest" ON public.workshop_registrations FOR INSERT WITH CHECK (user_id IS NULL AND guest_email IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "workshop_registrations_update_admin" ON public.workshop_registrations FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- site_settings
DO $$ BEGIN CREATE POLICY "site_settings_select_public" ON public.site_settings FOR SELECT USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "site_settings_modify_admin" ON public.site_settings FOR ALL USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- artisans
DO $$ BEGIN CREATE POLICY "artisans_select_public" ON public.artisans FOR SELECT USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "artisans_insert_admin" ON public.artisans FOR INSERT WITH CHECK (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "artisans_update_admin" ON public.artisans FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "artisans_delete_admin" ON public.artisans FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ugc_photos
DO $$ BEGIN CREATE POLICY "ugc_photos_select_approved_public" ON public.ugc_photos FOR SELECT USING (is_approved = TRUE OR public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ugc_photos_insert_admin" ON public.ugc_photos FOR INSERT WITH CHECK (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ugc_photos_update_admin" ON public.ugc_photos FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ugc_photos_delete_admin" ON public.ugc_photos FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- collections
DO $$ BEGIN CREATE POLICY "collections_select_published_public" ON public.collections FOR SELECT USING (is_published = TRUE OR public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "collections_insert_admin" ON public.collections FOR INSERT WITH CHECK (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "collections_update_admin" ON public.collections FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "collections_delete_admin" ON public.collections FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- collection_products
DO $$ BEGIN CREATE POLICY "collection_products_select_published_public" ON public.collection_products FOR SELECT USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.collections WHERE collections.id = collection_products.collection_id AND collections.is_published = TRUE)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "collection_products_insert_admin" ON public.collection_products FOR INSERT WITH CHECK (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "collection_products_update_admin" ON public.collection_products FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "collection_products_delete_admin" ON public.collection_products FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- custom_orders
DO $$ BEGIN CREATE POLICY "custom_orders_insert_public" ON public.custom_orders FOR INSERT WITH CHECK (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "custom_orders_select_admin" ON public.custom_orders FOR SELECT USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "custom_orders_update_admin" ON public.custom_orders FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "custom_orders_delete_admin" ON public.custom_orders FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- incubator_enquiries
DO $$ BEGIN CREATE POLICY "incubator_enquiries_insert_public" ON public.incubator_enquiries FOR INSERT WITH CHECK (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "incubator_enquiries_select_admin" ON public.incubator_enquiries FOR SELECT USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "incubator_enquiries_update_admin" ON public.incubator_enquiries FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "incubator_enquiries_delete_admin" ON public.incubator_enquiries FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES
  ('product-images', 'product-images', TRUE, FALSE),
  ('payment-proofs', 'payment-proofs', FALSE, FALSE),
  ('avatars', 'avatars', TRUE, FALSE),
  ('custom-orders', 'custom-orders', FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$ BEGIN CREATE POLICY "storage_product_images_select_public" ON storage.objects FOR SELECT USING (bucket_id = 'product-images'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "storage_product_images_insert_admin" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "storage_product_images_update_admin" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "storage_product_images_delete_admin" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "storage_payment_proofs_select_admin" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs' AND public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "storage_payment_proofs_insert_auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "storage_payment_proofs_update_admin" ON storage.objects FOR UPDATE USING (bucket_id = 'payment-proofs' AND public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "storage_avatars_select_public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "storage_avatars_insert_auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "storage_avatars_update_own" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "storage_custom_orders_insert_public" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'custom-orders'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "storage_custom_orders_select_admin" ON storage.objects FOR SELECT USING (bucket_id = 'custom-orders' AND public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "storage_custom_orders_update_admin" ON storage.objects FOR UPDATE USING (bucket_id = 'custom-orders' AND public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "storage_custom_orders_delete_admin" ON storage.objects FOR DELETE USING (bucket_id = 'custom-orders' AND public.is_admin()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- SEED: Site Settings
-- ============================================================
INSERT INTO public.site_settings (key, value) VALUES
  ('products_crafted_count', '500'),
  ('store_whatsapp', '923001234567'),
  ('support_hours', 'Mon-Fri 9AM-6PM PKT'),
  ('bank_name', 'Meezan Bank'),
  ('bank_account', '1234567890'),
  ('bank_iban', 'PK36MEZN0001234567890'),
  ('delivery_policy_text', 'Standard delivery 3-5 business days. COD available in major cities.')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SYNC ADMIN PROFILES: ensure all admin users have matching profiles
-- ============================================================
DO $$
DECLARE
  admin_user RECORD;
BEGIN
  FOR admin_user IN
    SELECT id, email, raw_user_meta_data, raw_app_meta_data
    FROM auth.users
    WHERE (raw_app_meta_data ->> 'role') = 'admin'
  LOOP
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      admin_user.id,
      admin_user.email,
      COALESCE(admin_user.raw_user_meta_data ->> 'full_name', SPLIT_PART(admin_user.email, '@', 1)),
      'admin'
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  END LOOP;
END;
$$;
