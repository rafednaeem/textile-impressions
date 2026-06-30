-- ============================================================
-- FIX: Ensure admin auth works on restored database
-- ============================================================
-- This migration ensures all required functions, policies,
-- and data exist for admin operations to work correctly.
-- Uses IF NOT EXISTS / OR REPLACE to be idempotent.

-- ============================================================
-- 1. Ensure is_admin() function exists
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

-- ============================================================
-- 2. Ensure handle_new_user() trigger exists (auto-create profiles)
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

-- ============================================================
-- 3. Ensure sync_role_to_metadata() trigger exists
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

-- ============================================================
-- 4. Ensure triggers exist
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_profile_role_changed ON public.profiles;
CREATE TRIGGER on_profile_role_changed
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_to_metadata();

-- ============================================================
-- 5. Sync admin users: ensure profiles exist and match JWT
-- ============================================================
-- For any admin user whose profile is missing or has wrong role,
-- update the profile to match their JWT app_metadata.
DO $$
DECLARE
  admin_user RECORD;
BEGIN
  FOR admin_user IN
    SELECT id, email, raw_user_meta_data, raw_app_meta_data
    FROM auth.users
    WHERE (raw_app_meta_data ->> 'role') = 'admin'
  LOOP
    -- Upsert profile with admin role
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

-- ============================================================
-- 6. Ensure RLS policies exist for all required tables
-- ============================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "profiles_select_admin" ON public.profiles
    FOR SELECT USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "categories_select_public" ON public.categories
    FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "categories_insert_admin" ON public.categories
    FOR INSERT WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "categories_update_admin" ON public.categories
    FOR UPDATE USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "categories_delete_admin" ON public.categories
    FOR DELETE USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "products_select_public" ON public.products
    FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "products_insert_admin" ON public.products
    FOR INSERT WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "products_update_admin" ON public.products
    FOR UPDATE USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "products_delete_admin" ON public.products
    FOR DELETE USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- product_images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "product_images_select_public" ON public.product_images
    FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "product_images_insert_admin" ON public.product_images
    FOR INSERT WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "product_images_update_admin" ON public.product_images
    FOR UPDATE USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "product_images_delete_admin" ON public.product_images
    FOR DELETE USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "product_variants_select_public" ON public.product_variants
    FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "product_variants_insert_admin" ON public.product_variants
    FOR INSERT WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "product_variants_update_admin" ON public.product_variants
    FOR UPDATE USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "product_variants_delete_admin" ON public.product_variants
    FOR DELETE USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- workshops
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "workshops_select_public" ON public.workshops
    FOR SELECT USING (status = 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "workshops_select_admin" ON public.workshops
    FOR SELECT USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "workshops_insert_admin" ON public.workshops
    FOR INSERT WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "workshops_update_admin" ON public.workshops
    FOR UPDATE USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "workshops_delete_admin" ON public.workshops
    FOR DELETE USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- discount_codes
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "discount_codes_select_admin" ON public.discount_codes
    FOR SELECT USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "discount_codes_insert_admin" ON public.discount_codes
    FOR INSERT WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "discount_codes_update_admin" ON public.discount_codes
    FOR UPDATE USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "discount_codes_delete_admin" ON public.discount_codes
    FOR DELETE USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "wishlists_select_own" ON public.wishlists
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "wishlists_insert_own" ON public.wishlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "wishlists_delete_own" ON public.wishlists
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 7. Ensure storage policies exist
-- ============================================================
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES
  ('product-images', 'product-images', TRUE, FALSE),
  ('payment-proofs', 'payment-proofs', FALSE, FALSE),
  ('avatars', 'avatars', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "product_images_select_public_storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "product_images_insert_admin_storage" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "product_images_update_admin_storage" ON storage.objects
    FOR UPDATE USING (bucket_id = 'product-images' AND public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "product_images_delete_admin_storage" ON storage.objects
    FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
