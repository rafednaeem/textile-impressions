export type UserRole = "customer" | "admin"

export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "payment_submitted"
  | "payment_verified"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "cod_pending"
  | "dispatched"

export type PaymentMethod = "bank_transfer" | "cod"

export type PaymentStatus = "pending" | "submitted" | "verified" | "rejected"

export type DiscountType = "percentage" | "fixed"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  price: number
  sale_price: number | null
  sku: string | null
  inventory_count: number
  is_active: boolean
  is_featured: boolean
  category_id: string | null
  tags: string[]
  craft_type: string | null
  fabric: string | null
  care_instructions: string | null
  created_at: string
  updated_at: string
  product_images?: ProductImage[] | null
}

export interface Artisan {
  id: string
  name: string
  craft: string
  city: string
  region: string | null
  bio: string
  image_url: string | null
  is_featured: boolean
  sort_order: number
  created_at: string
}

export interface UgcPhoto {
  id: string
  customer_name: string
  image_url: string
  product_id: string | null
  is_approved: boolean
  submitted_via: string | null
  created_at: string
}

export interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  hero_image_url: string | null
  season: string | null
  year: number | null
  is_published: boolean
  created_at: string
}

export interface CollectionProduct {
  collection_id: string
  product_id: string
  sort_order: number
  editorial_note: string | null
}

export interface CustomOrder {
  id: string
  name: string
  phone: string
  garment_type: string
  fabric_preference: string | null
  color_preference: string | null
  size: string | null
  quantity: number
  budget_range: string | null
  deadline: string | null
  notes: string | null
  reference_images: string[]
  status: string
  created_at: string
}

export interface IncubatorEnquiry {
  id: string
  name: string
  phone: string
  craft_type: string
  description: string | null
  status: string
  created_at: string
}

export interface Workshop {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  instructor_name: string
  cover_image_url: string | null
  format: 'in_person' | 'online' | 'hybrid'
  level: 'beginner' | 'intermediate' | 'advanced' | 'all_levels'
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
  status: 'draft' | 'published' | 'completed' | 'cancelled'
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
  status: 'registered' | 'waitlisted' | 'cancelled' | 'attended'
  meeting_link_sent: boolean
  registered_at: string
}

export interface SiteSetting {
  key: string
  value: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
}

export interface ProductVariant {
  id: string
  product_id: string
  size: string | null
  color: string | null
  inventory_count: number
  sku_suffix: string | null
}

export interface Address {
  id: string
  user_id: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  province: string
  postal_code: string | null
  is_default: boolean
}

export interface Cart {
  id: string
  user_id: string | null
  session_id: string | null
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  price_at_time: number
}

export interface Order {
  id: string
  order_number: string
  user_id: string | null
  status: OrderStatus
  shipping_address: Record<string, unknown>
  subtotal: number
  shipping_cost: number
  total: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  product_name: string
  product_image: string | null
  size: string | null
  color: string | null
  quantity: number
  unit_price: number
  total_price: number
}

export interface Payment {
  id: string
  order_id: string
  method: PaymentMethod
  status: PaymentStatus
  proof_url: string | null
  proof_uploaded_at: string | null
  verified_at: string | null
  verified_by: string | null
  rejection_reason: string | null
  transaction_reference: string | null
}

export interface OrderTimeline {
  id: string
  order_id: string
  status: OrderStatus
  note: string | null
  created_by: string | null
  created_at: string
}

export interface DiscountCode {
  id: string
  code: string
  type: DiscountType
  value: number
  min_order_amount: number | null
  max_uses: number | null
  used_count: number
  is_active: boolean
  expires_at: string | null
}

export interface Wishlist {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, "created_at" | "updated_at">
        Update: Partial<Omit<Profile, "id">>
        Relationships: []
      }
      categories: {
        Row: Category
        Insert: Omit<Category, "id" | "created_at">
        Update: Partial<Omit<Category, "id">>
        Relationships: []
      }
      products: {
        Row: Product
        Insert: Omit<Product, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Product, "id">>
        Relationships: []
      }
      product_images: {
        Row: ProductImage
        Insert: Omit<ProductImage, "id">
        Update: Partial<Omit<ProductImage, "id">>
        Relationships: []
      }
      product_variants: {
        Row: ProductVariant
        Insert: Omit<ProductVariant, "id">
        Update: Partial<Omit<ProductVariant, "id">>
        Relationships: []
      }
      addresses: {
        Row: Address
        Insert: Omit<Address, "id">
        Update: Partial<Omit<Address, "id">>
        Relationships: []
      }
      carts: {
        Row: Cart
        Insert: Omit<Cart, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Cart, "id">>
        Relationships: []
      }
      cart_items: {
        Row: CartItem
        Insert: Omit<CartItem, "id">
        Update: Partial<Omit<CartItem, "id">>
        Relationships: []
      }
      orders: {
        Row: Order
        Insert: Omit<Order, "id" | "order_number" | "created_at" | "updated_at">
        Update: Partial<Omit<Order, "id" | "order_number">>
        Relationships: []
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, "id">
        Update: Partial<Omit<OrderItem, "id">>
        Relationships: []
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, "id" | "proof_uploaded_at" | "verified_at">
        Update: Partial<Omit<Payment, "id">>
        Relationships: []
      }
      order_timeline: {
        Row: OrderTimeline
        Insert: Omit<OrderTimeline, "id" | "created_at">
        Update: Partial<Omit<OrderTimeline, "id">>
        Relationships: []
      }
      discount_codes: {
        Row: DiscountCode
        Insert: Omit<DiscountCode, "id" | "used_count">
        Update: Partial<Omit<DiscountCode, "id">>
        Relationships: []
      }
      wishlists: {
        Row: Wishlist
        Insert: Omit<Wishlist, "id" | "created_at">
        Update: Partial<Omit<Wishlist, "id">>
        Relationships: []
      }
      artisans: {
        Row: Artisan
        Insert: Omit<Artisan, "id" | "created_at">
        Update: Partial<Omit<Artisan, "id">>
        Relationships: []
      }
      ugc_photos: {
        Row: UgcPhoto
        Insert: Omit<UgcPhoto, "id" | "created_at">
        Update: Partial<Omit<UgcPhoto, "id">>
        Relationships: []
      }
      collections: {
        Row: Collection
        Insert: Omit<Collection, "id" | "created_at">
        Update: Partial<Omit<Collection, "id">>
        Relationships: []
      }
      collection_products: {
        Row: CollectionProduct
        Insert: CollectionProduct
        Update: Partial<CollectionProduct>
        Relationships: []
      }
      custom_orders: {
        Row: CustomOrder
        Insert: Omit<CustomOrder, "id" | "created_at">
        Update: Partial<Omit<CustomOrder, "id">>
        Relationships: []
      }
      incubator_enquiries: {
        Row: IncubatorEnquiry
        Insert: Omit<IncubatorEnquiry, "id" | "created_at">
        Update: Partial<Omit<IncubatorEnquiry, "id">>
        Relationships: []
      }
      workshops: {
        Row: Workshop
        Insert: Omit<Workshop, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Workshop, "id">>
        Relationships: []
      }
      workshop_registrations: {
        Row: WorkshopRegistration
        Insert: Omit<WorkshopRegistration, "id" | "registered_at">
        Update: Partial<Omit<WorkshopRegistration, "id">>
        Relationships: []
      }
      site_settings: {
        Row: SiteSetting
        Insert: Omit<SiteSetting, "updated_at">
        Update: Partial<Omit<SiteSetting, "key">>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      generate_order_number: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
}
