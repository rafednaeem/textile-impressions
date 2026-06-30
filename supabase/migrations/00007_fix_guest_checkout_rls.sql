-- Fix guest checkout RLS: ensure orders, order_items, payments, order_timeline
-- allow inserts for unauthenticated users (guest checkout) where user_id IS NULL.

-- 1. Ensure user_id is nullable on orders
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- 2. Grant schema usage and table-level permissions to anon role (needed for RLS to work)
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

-- 3. Orders INSERT policy: allow own user_id OR guest order (user_id IS NULL)
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id
  );

-- 4. Order items INSERT policy: allow items linked to guest orders or own orders
DROP POLICY IF EXISTS "order_items_insert_own" ON public.order_items;
CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id IS NULL OR orders.user_id = auth.uid())
    )
  );

-- 5. Payments INSERT policy: allow payments for guest orders or own orders
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND (orders.user_id IS NULL OR orders.user_id = auth.uid())
    )
  );

-- 6. Order timeline INSERT policy: admin OR linked to guest/own order
DROP POLICY IF EXISTS "order_timeline_insert_admin" ON public.order_timeline;
CREATE POLICY "order_timeline_insert_admin" ON public.order_timeline
  FOR INSERT WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_timeline.order_id
      AND (orders.user_id IS NULL OR orders.user_id = auth.uid())
    )
  );
