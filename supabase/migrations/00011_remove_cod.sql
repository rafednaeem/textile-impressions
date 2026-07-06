-- ============================================================
-- TEXTILE IMPRESSIONS — Remove Cash on Delivery (COD)
-- ============================================================
-- Standardizes the store on Bank Transfer payments only.
-- Existing COD orders are migrated to the bank-transfer flow.
-- ============================================================

-- 1. Migrate existing COD orders to the bank-transfer workflow.
--    Orders that were awaiting dispatch under COD are treated as
--    payment-verified so the existing fulfilment flow continues.
UPDATE public.orders
SET status = 'payment_verified'
WHERE status = 'cod_pending';

-- 2. Migrate existing COD payment rows to bank_transfer/verified.
UPDATE public.payments
SET
  method = 'bank_transfer',
  status = 'verified'
WHERE method = 'cod';

-- 3. Migrate any order_timeline entries that referenced cod_pending.
UPDATE public.order_timeline
SET status = 'payment_verified'
WHERE status = 'cod_pending';

-- 4. Update payments table enum to only allow bank_transfer.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_method_check
  CHECK (method IN ('bank_transfer'));

-- 5. Remove cod_pending from order status enum.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'payment_pending', 'payment_submitted',
    'payment_verified', 'processing', 'shipped',
    'delivered', 'cancelled', 'dispatched'
  ));

-- 6. Remove cod_pending from order_timeline status enum.
ALTER TABLE public.order_timeline DROP CONSTRAINT IF EXISTS order_timeline_status_check;
ALTER TABLE public.order_timeline ADD CONSTRAINT order_timeline_status_check
  CHECK (status IN (
    'pending', 'payment_pending', 'payment_submitted',
    'payment_verified', 'processing', 'shipped',
    'delivered', 'cancelled', 'dispatched'
  ));

-- 7. Update the default delivery policy text so it no longer mentions COD.
UPDATE public.site_settings
SET value = 'Standard delivery 3-5 business days. We accept Bank Transfer payments only.'
WHERE key = 'delivery_policy_text'
  AND value = 'Standard delivery 3-5 business days. COD available in major cities.';
