export type WorkshopFormat = 'in_person' | 'online' | 'hybrid'
export type WorkshopLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels'
export type WorkshopStatus = 'draft' | 'published' | 'completed' | 'cancelled'

export type WorkshopRegistrationStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'payment_submitted'
  | 'payment_under_review'
  | 'confirmed'
  | 'waitlisted'
  | 'cancelled'
  | 'attended'
  | 'no_show'
  | 'completed'

export type WorkshopPaymentStatus = 'none' | 'awaiting' | 'submitted' | 'verified' | 'rejected'
export type WorkshopPaymentMethod = 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'stripe'

export interface Workshop {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  instructor_name: string
  cover_image_url: string | null
  format: WorkshopFormat
  level: WorkshopLevel
  date_start: string | null
  date_end: string | null
  duration_minutes: number | null
  location_address: string | null
  online_meeting_platform: string | null
  online_meeting_id: string | null
  online_meeting_url: string | null
  max_seats: number | null
  seats_remaining: number | null
  fee: number
  materials_included: boolean
  materials_list: string | null
  kit_product_id: string | null
  recording_url: string | null
  status: WorkshopStatus
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface WorkshopRegistration {
  id: string
  workshop_id: string
  user_id: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  status: WorkshopRegistrationStatus
  payment_status: WorkshopPaymentStatus
  meeting_link_sent: boolean
  admin_notes: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  checked_in_at: string | null
  waitlisted_at: string | null
  registered_at: string
}

export interface WorkshopPayment {
  id: string
  registration_id: string
  amount: number
  method: WorkshopPaymentMethod
  status: 'pending' | 'submitted' | 'verified' | 'rejected'
  proof_url: string | null
  transaction_ref: string | null
  rejection_reason: string | null
  verified_at: string | null
  verified_by: string | null
  created_at: string
}

export interface AdminNotification {
  id: string
  type: string
  title: string
  message: string | null
  metadata: Record<string, unknown>
  read: boolean
  created_at: string
}

export interface SiteSetting {
  key: string
  value: string
  updated_at: string
}

export const WORKSHOP_FORMAT_LABELS: Record<WorkshopFormat, string> = {
  in_person: 'In Person',
  online: 'Online',
  hybrid: 'Hybrid',
}

export const WORKSHOP_FORMAT_ICONS: Record<WorkshopFormat, string> = {
  in_person: 'map-pin',
  online: 'monitor',
  hybrid: 'cpu',
}

export const WORKSHOP_LEVEL_LABELS: Record<WorkshopLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  all_levels: 'All Levels',
}

export const WORKSHOP_STATUS_LABELS: Record<WorkshopStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const WORKSHOP_REGISTRATION_STATUS_LABELS: Record<WorkshopRegistrationStatus, string> = {
  pending: 'Pending',
  awaiting_payment: 'Awaiting Payment',
  payment_submitted: 'Payment Submitted',
  payment_under_review: 'Payment Under Review',
  confirmed: 'Confirmed',
  waitlisted: 'Waitlisted',
  cancelled: 'Cancelled',
  attended: 'Attended',
  no_show: 'No Show',
  completed: 'Completed',
}

export const WORKSHOP_REGISTRATION_STATUS_COLORS: Record<WorkshopRegistrationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  awaiting_payment: 'bg-orange-100 text-orange-700',
  payment_submitted: 'bg-blue-100 text-blue-700',
  payment_under_review: 'bg-purple-100 text-purple-700',
  confirmed: 'bg-green-100 text-green-700',
  waitlisted: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  attended: 'bg-emerald-100 text-emerald-700',
  no_show: 'bg-amber-100 text-amber-700',
  completed: 'bg-slate-100 text-slate-700',
}

export const WORKSHOP_PAYMENT_STATUS_LABELS: Record<WorkshopPaymentStatus, string> = {
  none: 'No Payment',
  awaiting: 'Awaiting Payment',
  submitted: 'Proof Submitted',
  verified: 'Verified',
  rejected: 'Rejected',
}

export const WORKSHOP_PAYMENT_STATUS_COLORS: Record<WorkshopPaymentStatus, string> = {
  none: 'bg-gray-100 text-gray-600',
  awaiting: 'bg-orange-100 text-orange-700',
  submitted: 'bg-blue-100 text-blue-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export const COD_CITIES = ['karachi'] as const
export type CodCity = typeof COD_CITIES[number]

export function isCodEligible(city: string): boolean {
  return COD_CITIES.includes(city.toLowerCase() as CodCity)
}
