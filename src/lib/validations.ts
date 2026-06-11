import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const signupSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(/^(\+92|0|92)?[0-9]{10}$/, "Invalid Pakistani phone number")
      .optional()
      .or(z.literal("")),
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

export const addressSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^(\+92|0|92)?[0-9]{10}$/, "Invalid Pakistani phone number"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "City is required"),
  province: z.string().min(2, "Province is required"),
  postalCode: z.string().optional().or(z.literal("")),
  isDefault: z.boolean().default(false),
})

export const paymentProofSchema = z.object({
  method: z.enum(["bank_transfer", "easypaisa", "jazzcash", "whatsapp"] as const, {
    message: "Payment method is required",
  }),
  transactionReference: z.string().min(3, "Transaction reference is required"),
})

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z
    .string()
    .regex(/^(\+92|0|92)?[0-9]{10}$/)
    .optional()
    .or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type PaymentProofInput = z.infer<typeof paymentProofSchema>
