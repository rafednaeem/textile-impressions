export const STORE_NAME = "Textile Impressions"

export const ORDER_STATUSES = [
  "pending",
  "payment_pending",
  "payment_submitted",
  "payment_verified",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "cod_pending",
  "dispatched",
] as const

export const PAYMENT_METHODS = [
  "bank_transfer",
  "cod",
] as const

export const DISCOUNT_TYPES = ["percentage", "fixed"] as const

export const SHIPPING_COST = 200

export const FREE_SHIPPING_THRESHOLD = 2000

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const ROLES = ["customer", "admin"] as const
