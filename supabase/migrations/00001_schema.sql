-- ============================================================
-- TEXTILE IMPRESSIONS — Complete Database Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SEQUENCES
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if the current user is an admin via JWT app_metadata
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    FALSE
  );
END;
$$;

-- Generate a unique order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  seq_num TEXT;
BEGIN
  seq_num := LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || seq_num;
END;
$$;

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE public.categories (
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

CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_active ON public.categories(is_active);

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  sale_price NUMERIC(10, 2) CHECK (sale_price IS NULL OR sale_price >= 0),
  sku TEXT NOT NULL UNIQUE,
  inventory_count INTEGER NOT NULL DEFAULT 0 CHECK (inventory_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  fabric TEXT,
  care_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sale_price_check CHECK (sale_price IS NULL OR sale_price < price)
);

CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_products_featured ON public.products(is_featured);
CREATE INDEX idx_products_tags ON public.products USING GIN(tags);

-- ============================================================
-- TABLE: product_images
-- ============================================================
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_product_images_product ON public.product_images(product_id);

-- ============================================================
-- TABLE: product_variants
-- ============================================================
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  inventory_count INTEGER NOT NULL DEFAULT 0 CHECK (inventory_count >= 0),
  sku_suffix TEXT,
  UNIQUE(product_id, size, color)
);

CREATE INDEX idx_product_variants_product ON public.product_variants(product_id);

-- ============================================================
-- TABLE: addresses
-- ============================================================
CREATE TABLE public.addresses (
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

CREATE INDEX idx_addresses_user ON public.addresses(user_id);

-- ============================================================
-- TABLE: carts
-- ============================================================
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cart_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE UNIQUE INDEX idx_carts_user ON public.carts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_carts_session ON public.carts(session_id) WHERE session_id IS NOT NULL;

-- ============================================================
-- TABLE: cart_items
-- ============================================================
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time NUMERIC(10, 2) NOT NULL CHECK (price_at_time >= 0)
);

CREATE INDEX idx_cart_items_cart ON public.cart_items(cart_id);

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'payment_pending', 'payment_submitted',
    'payment_verified', 'processing', 'shipped',
    'delivered', 'cancelled'
  )),
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

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

CREATE OR REPLACE TRIGGER trg_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION public.set_order_number();

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE public.order_items (
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

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- ============================================================
-- TABLE: payments
-- ============================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'easypaisa', 'jazzcash', 'whatsapp')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'verified', 'rejected')),
  proof_url TEXT,
  proof_uploaded_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  transaction_reference TEXT
);

CREATE INDEX idx_payments_order ON public.payments(order_id);

-- ============================================================
-- TABLE: order_timeline
-- ============================================================
CREATE TABLE public.order_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'payment_pending', 'payment_submitted',
    'payment_verified', 'processing', 'shipped',
    'delivered', 'cancelled'
  )),
  note TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_timeline_order ON public.order_timeline(order_id);
CREATE INDEX idx_order_timeline_created ON public.order_timeline(created_at DESC);

-- ============================================================
-- TABLE: discount_codes
-- ============================================================
CREATE TABLE public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC(10, 2) NOT NULL CHECK (value > 0),
  min_order_amount NUMERIC(10, 2) CHECK (min_order_amount IS NULL OR min_order_amount >= 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_discount_codes_code ON public.discount_codes(code);

-- ============================================================
-- TABLE: wishlists
-- ============================================================
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON public.wishlists(user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SYNC PROFILE ROLE TO AUTH USER APP METADATA (for JWT claims)
-- ============================================================
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

CREATE OR REPLACE TRIGGER on_profile_role_changed
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_to_metadata();

-- ============================================================
-- ROW LEVEL SECURITY — ENABLE ON ALL TABLES
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

-- ============================================================
-- RLS POLICIES — profiles
-- ============================================================
-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Users can update their own profile (but not role)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND (
    CASE WHEN role IS DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid())
      THEN FALSE
      ELSE TRUE
    END
  ));

-- ============================================================
-- RLS POLICIES — categories
-- ============================================================
CREATE POLICY "categories_select_public" ON public.categories
  FOR SELECT USING (TRUE);

CREATE POLICY "categories_insert_admin" ON public.categories
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "categories_delete_admin" ON public.categories
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — products
-- ============================================================
CREATE POLICY "products_select_public" ON public.products
  FOR SELECT USING (TRUE);

CREATE POLICY "products_insert_admin" ON public.products
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "products_update_admin" ON public.products
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — product_images
-- ============================================================
CREATE POLICY "product_images_select_public" ON public.product_images
  FOR SELECT USING (TRUE);

CREATE POLICY "product_images_insert_admin" ON public.product_images
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "product_images_update_admin" ON public.product_images
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "product_images_delete_admin" ON public.product_images
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — product_variants
-- ============================================================
CREATE POLICY "product_variants_select_public" ON public.product_variants
  FOR SELECT USING (TRUE);

CREATE POLICY "product_variants_insert_admin" ON public.product_variants
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "product_variants_update_admin" ON public.product_variants
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "product_variants_delete_admin" ON public.product_variants
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — addresses
-- ============================================================
CREATE POLICY "addresses_select_own" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "addresses_insert_own" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_update_own" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "addresses_delete_own" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES — carts
-- ============================================================
CREATE POLICY "carts_select_own" ON public.carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "carts_insert_own" ON public.carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "carts_update_own" ON public.carts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "carts_delete_own" ON public.carts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES — cart_items
-- ============================================================
CREATE POLICY "cart_items_select_own" ON public.cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "cart_items_insert_own" ON public.cart_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "cart_items_update_own" ON public.cart_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "cart_items_delete_own" ON public.cart_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES — orders
-- ============================================================
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_select_admin" ON public.orders
  FOR SELECT USING (public.is_admin());

CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — order_items
-- ============================================================
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_select_admin" ON public.order_items
  FOR SELECT USING (public.is_admin());

CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_insert_admin" ON public.order_items
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "order_items_update_admin" ON public.order_items
  FOR UPDATE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — payments
-- ============================================================
-- Users can create a payment for their own order
CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Users can view payments on their own orders
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can view all payments
CREATE POLICY "payments_select_admin" ON public.payments
  FOR SELECT USING (public.is_admin());

-- Admins can update payments (verify/reject)
CREATE POLICY "payments_update_admin" ON public.payments
  FOR UPDATE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — order_timeline
-- ============================================================
CREATE POLICY "order_timeline_select_own" ON public.order_timeline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_timeline.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "order_timeline_select_admin" ON public.order_timeline
  FOR SELECT USING (public.is_admin());

CREATE POLICY "order_timeline_insert_admin" ON public.order_timeline
  FOR INSERT WITH CHECK (public.is_admin());

-- ============================================================
-- RLS POLICIES — discount_codes (admin only)
-- ============================================================
CREATE POLICY "discount_codes_select_admin" ON public.discount_codes
  FOR SELECT USING (public.is_admin());

CREATE POLICY "discount_codes_insert_admin" ON public.discount_codes
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "discount_codes_update_admin" ON public.discount_codes
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "discount_codes_delete_admin" ON public.discount_codes
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — wishlists
-- ============================================================
CREATE POLICY "wishlists_select_own" ON public.wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wishlists_insert_own" ON public.wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlists_delete_own" ON public.wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES
  ('product-images', 'product-images', TRUE, FALSE),
  ('payment-proofs', 'payment-proofs', FALSE, FALSE),
  ('avatars', 'avatars', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================

-- product-images: public read, admin write
CREATE POLICY "product_images_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND public.is_admin()
  );

CREATE POLICY "product_images_update_admin" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND public.is_admin()
  );

CREATE POLICY "product_images_delete_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND public.is_admin()
  );

-- payment-proofs: authenticated users can upload, admins can read all
CREATE POLICY "payment_proofs_select_admin" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs' AND public.is_admin()
  );

CREATE POLICY "payment_proofs_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs' AND auth.role() = 'authenticated'
  );

CREATE POLICY "payment_proofs_update_admin" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'payment-proofs' AND public.is_admin()
  );

-- avatars: public read, authenticated users upload own
CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

-- ============================================================
-- AUTO-UPDATE updated_at TIMESTAMPS
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
