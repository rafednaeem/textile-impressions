const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Textile Impressions"
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923XXXXXXXXX"

export { storeName, baseUrl, whatsappNumber }

export const WORKSHOP_FORMATS = ['in_person', 'online', 'hybrid'] as const
export type WorkshopFormat = typeof WORKSHOP_FORMATS[number]

export const WORKSHOP_LEVELS = ['beginner', 'intermediate', 'advanced', 'all_levels'] as const
export type WorkshopLevel = typeof WORKSHOP_LEVELS[number]

export const WORKSHOP_STATUSES = ['draft', 'published', 'completed', 'cancelled'] as const
export type WorkshopStatus = typeof WORKSHOP_STATUSES[number]

export const WORKSHOP_REGISTRATION_STATUSES = ['registered', 'waitlisted', 'cancelled', 'attended'] as const
export type WorkshopRegistrationStatus = typeof WORKSHOP_REGISTRATION_STATUSES[number]

export const COD_CITIES = ['karachi'] as const
export type CodCity = typeof COD_CITIES[number]

export function isCodEligible(city: string): boolean {
  return COD_CITIES.includes(city.toLowerCase() as CodCity)
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  payment_pending: 'Payment Pending',
  payment_submitted: 'Payment Submitted',
  payment_verified: 'Payment Verified',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  cod_pending: 'COD - Awaiting Dispatch',
  dispatched: 'Dispatched',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  cod: 'Cash on Delivery',
}

export const WORKSHOP_FORMAT_LABELS: Record<string, string> = {
  in_person: 'In Person',
  online: 'Online',
  hybrid: 'Hybrid',
}

export const WORKSHOP_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  all_levels: 'All Levels',
}

export const WORKSHOP_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  completed: 'Completed',
  cancelled: 'Cancelled',
}