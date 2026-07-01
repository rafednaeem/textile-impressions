import { z } from "zod"

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

function normalizePhone(val: string): string {
  return val.replace(/[\s\-\(\)]/g, "")
}

const FAKE_PATTERNS = [
  /^(\d)\1{9,}$/,
  /^0{10,}$/,
  /^1{10,}$/,
  /^2{10,}$/,
  /^9{10,}$/,
  /^1234567890/,
  /^0123456789/,
  /^9876543210/,
]

const GIBBERISH_PATTERNS = [
  /^(.+?)\1{3,}$/,
  /^(?:a[sdfghjkl]{3,}|q[wertyuiop]{3,}|z[xcvbnm]{3,})$/i,
  /^(?:asdf|qwerty|zxcv|qwertyuiop|asdfghjkl|zxcvbnm)$/i,
  /^(?:test|abc|xyz|asd|qwe|qwerty|whatever|blah)$/i,
]

function isGibberish(val: string): boolean {
  return GIBBERISH_PATTERNS.some((re) => re.test(val.trim().toLowerCase()))
}

function hasExcessiveRepeats(val: string): boolean {
  return /(.)\1{4,}/.test(val)
}

// ──────────────────────────────────────────────
//  Common refinements
// ──────────────────────────────────────────────

const nameRefine = (label: string) =>
  z
    .string()
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(100, `${label} must be at most 100 characters`)
    .refine((v) => /[a-zA-Z\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u0900-\u097F]/.test(v), {
      message: `${label} must contain at least one letter`,
    })
    .refine((v) => !/^\d+$/.test(v), {
      message: `${label} cannot be only numbers`,
    })
    .refine((v) => !/^[^a-zA-Z0-9]+$/.test(v), {
      message: `${label} cannot contain only symbols`,
    })
    .refine((v) => !isGibberish(v), {
      message: `Please enter a valid ${label.toLowerCase()}`,
    })
    .refine((v) => !hasExcessiveRepeats(v), {
      message: `Please enter a valid ${label.toLowerCase()}`,
    })

const cityRefine = () =>
  z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must be at most 100 characters")
    .refine((v) => /[a-zA-Z\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u0900-\u097F]/.test(v), {
      message: "City must contain at least one letter",
    })
    .refine((v) => !/^\d+$/.test(v), {
      message: "City cannot be only numbers",
    })
    .refine((v) => !isGibberish(v), {
      message: "Please enter a valid city name",
    })
    .refine((v) => !hasExcessiveRepeats(v), {
      message: "Please enter a valid city name",
    })

const addressLineRefine = () =>
  z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address must be at most 500 characters")
    .refine((v) => !isGibberish(v), {
      message: "Please enter a valid address",
    })
    .refine((v) => !hasExcessiveRepeats(v), {
      message: "Please enter a valid address",
    })

const emailRefine = () =>
  z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .refine((v) => !/^.{1,3}@/.test(v), {
      message: "Please enter a complete email address",
    })
    .refine((v) => !/^[^@]+@[^@]{1,3}$/.test(v), {
      message: "Please enter a complete email address",
    })

// ──────────────────────────────────────────────
//  Phone: Pakistan
// ──────────────────────────────────────────────

export const pkPhone = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .transform(normalizePhone)
  .refine((v) => /^\d{11}$/.test(v), {
    message: "Pakistani phone number must be exactly 11 digits (e.g., 03XXXXXXXXX)",
  })
  .refine((v) => v.startsWith("03"), {
    message: "Pakistani phone number must start with 03",
  })
  .refine((v) => !FAKE_PATTERNS.some((re) => re.test(v)), {
    message: "Please enter a genuine phone number",
  })

export const pkPhoneOptional = z
  .string()
  .trim()
  .transform((v) => normalizePhone(v))
  .pipe(
    z
      .string()
      .refine(
        (v) => v === "" || /^\d{11}$/.test(v),
        "Pakistani phone number must be exactly 11 digits (e.g., 03XXXXXXXXX)"
      )
      .refine((v) => v === "" || v.startsWith("03"), "Must start with 03")
      .refine(
        (v) => v === "" || !FAKE_PATTERNS.some((re) => re.test(v)),
        "Please enter a genuine phone number"
      )
  )

// ──────────────────────────────────────────────
//  Phone: International (E.164)
// ──────────────────────────────────────────────

export const intlPhone = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .transform(normalizePhone)
  .refine((v) => /^\+[1-9]\d{6,14}$/.test(v), {
    message: "International phone must start with + followed by country code and number (e.g., +1XXXXXXXXXX)",
  })

export const intlPhoneOptional = z
  .string()
  .trim()
  .transform(normalizePhone)
  .pipe(
    z
      .string()
      .refine(
        (v) => v === "" || /^\+[1-9]\d{6,14}$/.test(v),
        "International phone must start with + followed by country code and number"
      )
  )

// ──────────────────────────────────────────────
//  Country-aware phone
// ──────────────────────────────────────────────

export const PAKISTAN_COUNTRY = "PK"
export const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const

export function phoneForCountry(country: string) {
  return country === PAKISTAN_COUNTRY ? pkPhone : intlPhone
}

export function phoneOptionalForCountry(country: string) {
  return country === PAKISTAN_COUNTRY ? pkPhoneOptional : intlPhoneOptional
}

// ──────────────────────────────────────────────
//  Country-aware postal code
// ──────────────────────────────────────────────

export const pkPostalCode = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{5}$/.test(v), {
    message: "Pakistani postal code must be exactly 5 digits (e.g., 54000)",
  })

export const intlPostalCode = z
  .string()
  .trim()
  .max(20, "Postal code is too long")
  .refine((v) => v === "" || /^[a-zA-Z0-9\s\-]{3,10}$/.test(v), {
    message: "Please enter a valid postal code (3-10 alphanumeric characters)",
  })

export function postalCodeForCountry(country: string) {
  return country === PAKISTAN_COUNTRY ? pkPostalCode : intlPostalCode
}

// ──────────────────────────────────────────────
//  Province / State
// ──────────────────────────────────────────────

export const pkProvince = z
  .string()
  .refine((v) => (PAKISTAN_PROVINCES as readonly string[]).includes(v), {
    message: "Please select a province",
  })

export const intlState = nameRefine("State/Province").optional().or(z.literal(""))

export function provinceForCountry(country: string) {
  return country === PAKISTAN_COUNTRY ? pkProvince : intlState
}

// ──────────────────────────────────────────────
//  Schemas
// ──────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
})

export const signupSchema = z
  .object({
    fullName: nameRefine("Full name"),
    email: emailRefine(),
    phone: pkPhoneOptional,
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const shippingAddressSchema = z.object({
  fullName: nameRefine("Full name"),
  phone: pkPhone,
  addressLine1: addressLineRefine(),
  addressLine2: z.string().trim().optional().or(z.literal("")),
  city: cityRefine(),
  province: z.string().trim().min(1, "Province is required"),
  postalCode: pkPostalCode,
})

export const checkoutShippingSchema = z.object({
  fullName: nameRefine("Full name"),
  phone: pkPhone,
  addressLine1: addressLineRefine(),
  addressLine2: z.string().trim().optional().or(z.literal("")),
  city: cityRefine(),
  province: z.string().trim().min(1, "Province is required"),
  postalCode: pkPostalCode,
  guestEmail: emailRefine().optional().or(z.literal("")),
})

export const checkoutPaymentSchema = z.object({
  paymentMethod: z
    .string()
    .refine((v) => ["bank_transfer", "cod"].includes(v), { message: "Please select a payment method" }),
  transactionReference: z.string().trim().min(3, "Transaction reference is required").optional().or(z.literal("")),
})

export const addressSchema = z.object({
  fullName: nameRefine("Full name"),
  phone: pkPhone,
  addressLine1: addressLineRefine(),
  addressLine2: z.string().trim().optional().or(z.literal("")),
  city: cityRefine(),
  province: z.string().trim().min(1, "Province is required"),
  postalCode: pkPostalCode,
  isDefault: z.boolean().default(false),
})

export const paymentProofSchema = z.object({
  method: z
    .string()
    .refine((v) => ["bank_transfer", "easypaisa", "jazzcash", "whatsapp"].includes(v), { message: "Payment method is required" }),
  transactionReference: z.string().min(3, "Transaction reference is required"),
})

export const profileUpdateSchema = z.object({
  fullName: nameRefine("Full name").optional(),
  phone: pkPhoneOptional.optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
})

export const orderApiSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().min(1, "Product ID is required"),
        variant_id: z.string().nullable().optional(),
        product_name: z.string().min(1, "Product name is required"),
        product_image: z.string().nullable().optional(),
        size: z.string().nullable().optional(),
        color: z.string().nullable().optional(),
        quantity: z.number().int().positive(),
        unit_price: z.number().positive(),
      })
    )
    .min(1, "Order must contain at least one item"),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z
    .string()
    .refine((v) => ["bank_transfer", "cod"].includes(v), { message: "Invalid payment method" }),
  proofUrl: z.string().nullable().optional(),
  transactionReference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  guestEmail: emailRefine().nullable().optional(),
})

export const workshopRegisterSchema = z.object({
  workshopId: z.string().uuid(),
  guestName: nameRefine("Name"),
  guestEmail: emailRefine(),
  guestPhone: pkPhoneOptional,
})

export const customOrderSchema = z.object({
  name: nameRefine("Name"),
  email: emailRefine(),
  phone: pkPhone,
  garment_type: z.string().min(1, "Garment type is required"),
  fabric_preference: z.string().optional().or(z.literal("")),
  color_preference: z.string().optional().or(z.literal("")),
  size: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().int().positive().optional(),
  budget_range: z.string().optional().or(z.literal("")),
  deadline: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})

export const incubatorEnquirySchema = z.object({
  name: nameRefine("Name"),
  email: emailRefine(),
  phone: pkPhone,
  craft_type: z.string().min(1, "Craft type is required"),
  description: z.string().optional().or(z.literal("")),
})

// ──────────────────────────────────────────────
//  Types
// ──────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type PaymentProofInput = z.infer<typeof paymentProofSchema>
export type CheckoutShippingInput = z.infer<typeof checkoutShippingSchema>
export type CheckoutPaymentInput = z.infer<typeof checkoutPaymentSchema>
export type OrderApiInput = z.infer<typeof orderApiSchema>
export type WorkshopRegisterInput = z.infer<typeof workshopRegisterSchema>
export type CustomOrderInput = z.infer<typeof customOrderSchema>
export type IncubatorEnquiryInput = z.infer<typeof incubatorEnquirySchema>
