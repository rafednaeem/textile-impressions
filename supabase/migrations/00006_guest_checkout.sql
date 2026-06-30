-- Guest checkout support: make orders.user_id nullable, fix GRANTs, update RLS policies

-- 0. Grant table-level permissions (lost when tables were dropped/recreated in 00005)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_timeline TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_timeline TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT ON public.product_images TO authenticated;
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT ON public.product_variants TO authenticated;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.categories TO authenticated;

-- 1. Make user_id nullable on orders
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- 2. Update orders INSERT policy to allow guest orders (user_id IS NULL)
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id
  );

-- 3. Update order_items INSERT policy to allow items for guest orders
DROP POLICY IF EXISTS "order_items_insert_own" ON public.order_items;
CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id IS NULL OR orders.user_id = auth.uid())
    )
  );

-- 4. Update payments INSERT policy to allow payments for guest orders
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND (orders.user_id IS NULL OR orders.user_id = auth.uid())
    )
  );

-- 5. Update order_timeline INSERT policy for guest orders and authenticated order owners
DROP POLICY IF EXISTS "order_timeline_insert_admin" ON public.order_timeline;
CREATE POLICY "order_timeline_insert_admin" ON public.order_timeline
  FOR INSERT WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_timeline.order_id
      AND (orders.user_id IS NULL OR orders.user_id = auth.uid())
    )
  );
