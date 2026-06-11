export type WorkshopFormat = 'in_person' | 'online' | 'hybrid'
export type WorkshopLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels'
export type WorkshopStatus = 'draft' | 'published' | 'completed' | 'cancelled'

export type WorkshopRegistrationStatus = 'registered' | 'waitlisted' | 'cancelled' | 'attended'

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
  payment_order_id: string | null
  status: WorkshopRegistrationStatus
  meeting_link_sent: boolean
  registered_at: string
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
  registered: 'Registered',
  waitlisted: 'Waitlisted',
  cancelled: 'Cancelled',
  attended: 'Attended',
}

export const COD_CITIES = ['karachi'] as const
export type CodCity = typeof COD_CITIES[number]

export function isCodEligible(city: string): boolean {
  return COD_CITIES.includes(city.toLowerCase() as CodCity)
}