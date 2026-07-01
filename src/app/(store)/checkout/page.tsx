"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  Loader2,
  Building2,
  Banknote,
  MapPin,
  AlertTriangle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useCart } from "@/hooks/useCart"
import { FREE_SHIPPING_THRESHOLD } from "@/constants"
import { isCodEligible } from "@/lib/constants"
import { checkoutShippingSchema, checkoutPaymentSchema } from "@/lib/validations"
import { useFieldValidation } from "@/hooks/useFieldValidation"

const PROVINCES = [
  "Punjab",
  "Sindh",
  "KPK",
  "Balochistan",
  "Gilgit-Baltistan",
  "AJK",
  "ICT",
] as const

const PROVINCE_TO_KEY: Record<string, string> = {
  Punjab: "shipping_punjab",
  Sindh: "shipping_sindh",
  KPK: "shipping_kpk",
  Balochistan: "shipping_balochistan",
  "Gilgit-Baltistan": "shipping_gilgit_baltistan",
  AJK: "shipping_ajk",
  ICT: "shipping_islamabad",
}

const PAYMENT_METHODS = [
  {
    id: "bank_transfer" as const,
    label: "Bank Transfer",
    icon: Building2,
    description: "Transfer to our Meezan Bank account and upload proof",
  },
  {
    id: "cod" as const,
    label: "Cash on Delivery (Karachi only)",
    icon: Banknote,
    description: "Pay when you receive your order. Available in Karachi only.",
  },
] as const

const STEPS = ["Shipping", "Payment", "Review", "Confirm"]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [orderResult, setOrderResult] = useState<any>(null)

  const [guestEmail, setGuestEmail] = useState("")

  const [shipping, setShipping] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
  })
  const [saveAddress, setSaveAddress] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [transactionRef, setTransactionRef] = useState("")
  const [notes, setNotes] = useState("")
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({})
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({})
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({})

  const shippingValidation = useFieldValidation(checkoutShippingSchema, {
    ...shipping,
    guestEmail: user ? undefined : guestEmail,
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user)
    })
  }, [supabase.auth])

  useEffect(() => {
    if (user) {
      supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .then(({ data }) => {
          if (data) setSavedAddresses(data)
        })
    }
  }, [user, supabase])

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {}
          data.forEach((s) => { map[s.key] = s.value })
          setSiteSettings(map)
        }
      })
  }, [supabase])

  const provinceShippingKey = shipping.province ? PROVINCE_TO_KEY[shipping.province] : null
  const provinceShipping = provinceShippingKey ? siteSettings[provinceShippingKey] : null
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (provinceShipping ? Number(provinceShipping) : 200)
  const total = subtotal + shippingCost

  const bankDetails = {
    bank: siteSettings.bank_name || "Meezan Bank",
    accountName: siteSettings.bank_account_title || "Textile Impressions",
    accountNumber: siteSettings.bank_account || "1234567890",
    iban: siteSettings.bank_iban || "PK36MEZN0001234567890",
  }

  const useAddress = useCallback((addr: any) => {
    setShipping({
      fullName: addr.full_name,
      phone: addr.phone,
      addressLine1: addr.address_line1,
      addressLine2: addr.address_line2 || "",
      city: addr.city,
      province: addr.province,
      postalCode: addr.postal_code || "",
    })
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProofFile(file)
      setProofPreview(URL.createObjectURL(file))
    }
  }

  const uploadProof = async (): Promise<string | null> => {
    if (!proofFile) return null
    setUploading(true)
    const formData = new FormData()
    formData.append("file", proofFile)

    const res = await fetch("/api/upload/payment-proof", {
      method: "POST",
      body: formData,
    })

    setUploading(false)
    if (!res.ok) return null

    const data = await res.json()
    return data.url ?? null
  }

  const placeOrder = async () => {
    if (!canContinue()) {
      toast.error("Please fix the errors before placing your order.")
      return
    }
    setCreating(true)
    let proofUrl: string | null = null
    if (proofFile && paymentMethod === "bank_transfer") {
      proofUrl = await uploadProof()
    }

    if (saveAddress && user) {
      await supabase.from("addresses").insert({
        user_id: user.id,
        full_name: shipping.fullName,
        phone: shipping.phone,
        address_line1: shipping.addressLine1,
        address_line2: shipping.addressLine2 || null,
        city: shipping.city,
        province: shipping.province,
        postal_code: shipping.postalCode || null,
        is_default: savedAddresses.length === 0,
      })
    }

    const orderItems = items.map((i) => ({
      product_id: i.product_id,
      variant_id: i.variant_id,
      product_name: i.product.name,
      product_image: i.image,
      size: i.variant?.size || null,
      color: i.variant?.color || null,
      quantity: i.quantity,
      unit_price: i.price_at_time,
    }))

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: orderItems,
        shippingAddress: {
          full_name: shipping.fullName,
          phone: shipping.phone,
          address_line1: shipping.addressLine1,
          address_line2: shipping.addressLine2,
          city: shipping.city,
          province: shipping.province,
          postal_code: shipping.postalCode,
        },
        paymentMethod,
        proofUrl,
        transactionReference: transactionRef || null,
        notes: notes || null,
        guestEmail: user ? null : guestEmail || null,
      }),
    })

    const result = await res.json()
    setCreating(false)

    if (!res.ok) {
      toast.error(result.error || "Failed to create order. Please try again.")
      return
    }

    setOrderResult(result)
    setStep(3)

    toast.success(`Order #${result.orderNumber} placed successfully!`, {
      description: paymentMethod === "cod"
        ? "Your order will be confirmed shortly."
        : "We'll verify your payment within 2-4 hours.",
    })

    clearCart()
  }

  const validateShipping = () => {
    if (!user && !guestEmail.trim()) {
      setShippingErrors({ guestEmail: "Email is required for guest checkout" })
      return false
    }
    const result = checkoutShippingSchema.safeParse({
      ...shipping,
      guestEmail: user ? undefined : guestEmail,
    })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setShippingErrors(fieldErrors)
      return false
    }
    setShippingErrors({})
    return true
  }

  const validatePayment = () => {
    const result = checkoutPaymentSchema.safeParse({
      paymentMethod,
      transactionReference: transactionRef || undefined,
    })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setPaymentErrors(fieldErrors)
      return false
    }
    setPaymentErrors({})
    return true
  }

  const handleShippingContinue = () => {
    shippingValidation.markAllTouched()
    if (validateShipping()) setStep(1)
  }

  const canContinue = () => {
    if (step === 0) return true
    if (step === 1) {
      if (!paymentMethod) return false
      if (paymentMethod === "cod" && !isCodEligible(shipping.city)) return false
      if (paymentMethod === "bank_transfer" && !proofFile) return false
      return true
    }
    return true
  }

  const codAllowed = isCodEligible(shipping.city)

  if (items.length === 0 && !orderResult) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="rounded-full bg-muted p-4 mx-auto w-fit">
          <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold text-brand-forest">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add some items before checking out.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  i < step
                    ? "bg-brand-forest text-white"
                    : i === step
                      ? "border-2 border-brand-forest text-brand-forest"
                      : "border-2 border-border text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden text-sm sm:inline ${i <= step ? "text-brand-forest font-medium" : "text-muted-foreground"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className="mx-1 h-px w-6 bg-border sm:w-12" />}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="shipping" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mx-auto max-w-2xl">
            <h2 className="font-heading text-2xl font-bold text-brand-forest">Shipping Information</h2>

            {savedAddresses.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Saved Addresses</p>
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => useAddress(addr)}
                    className="flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left text-sm transition-colors hover:border-brand-forest"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-terracotta" />
                    <div>
                      <p className="font-medium">{addr.full_name}</p>
                      <p className="text-muted-foreground">{addr.address_line1}, {addr.city}, {addr.province}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-4">
              {!user && (
                <div>
                  <label className="block text-sm font-medium">Email <span className="text-muted-foreground">(for order updates)</span></label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => {
                      setGuestEmail(e.target.value)
                      if (shippingErrors.guestEmail) setShippingErrors((p) => ({ ...p, guestEmail: "" }))
                      shippingValidation.handleChange("guestEmail")
                    }}
                    onBlur={() => {
                      if (!guestEmail.trim()) {
                        setShippingErrors((p) => ({ ...p, guestEmail: "Email is required for guest checkout" }))
                      } else {
                        shippingValidation.handleBlur("guestEmail")
                      }
                    }}
                    aria-invalid={!!(shippingErrors.guestEmail || shippingValidation.errors.guestEmail)}
                    aria-describedby={(shippingErrors.guestEmail || shippingValidation.errors.guestEmail) ? "guestEmail-error" : undefined}
                    className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${
                      (shippingErrors.guestEmail || shippingValidation.errors.guestEmail)
                        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : shippingValidation.getFieldState("guestEmail") === "valid" && guestEmail
                          ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          : "border-border focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
                    }`}
                    placeholder="you@example.com"
                  />
                  {(shippingErrors.guestEmail || shippingValidation.errors.guestEmail) && (
                    <p id="guestEmail-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
                      {shippingErrors.guestEmail || shippingValidation.errors.guestEmail}
                    </p>
                  )}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">Full Name</label>
                  <input
                    value={shipping.fullName}
                    onChange={(e) => {
                      setShipping({ ...shipping, fullName: e.target.value })
                      if (shippingErrors.fullName) setShippingErrors((p) => ({ ...p, fullName: "" }))
                      shippingValidation.handleChange("fullName")
                    }}
                    onBlur={() => shippingValidation.handleBlur("fullName")}
                    aria-invalid={!!(shippingErrors.fullName || shippingValidation.errors.fullName)}
                    aria-describedby={(shippingErrors.fullName || shippingValidation.errors.fullName) ? "fullName-error" : undefined}
                    className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${
                      (shippingErrors.fullName || shippingValidation.errors.fullName)
                        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : shippingValidation.getFieldState("fullName") === "valid" && shipping.fullName
                          ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          : "border-border focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
                    }`}
                    placeholder="Fatima Ahmed"
                  />
                  {(shippingErrors.fullName || shippingValidation.errors.fullName) && (
                    <p id="fullName-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
                      {shippingErrors.fullName || shippingValidation.errors.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">Phone</label>
                  <input
                    value={shipping.phone}
                    onChange={(e) => {
                      setShipping({ ...shipping, phone: e.target.value })
                      if (shippingErrors.phone) setShippingErrors((p) => ({ ...p, phone: "" }))
                      shippingValidation.handleChange("phone")
                    }}
                    onBlur={() => shippingValidation.handleBlur("phone")}
                    aria-invalid={!!(shippingErrors.phone || shippingValidation.errors.phone)}
                    aria-describedby={(shippingErrors.phone || shippingValidation.errors.phone) ? "phone-error" : undefined}
                    className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${
                      (shippingErrors.phone || shippingValidation.errors.phone)
                        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : shippingValidation.getFieldState("phone") === "valid" && shipping.phone
                          ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          : "border-border focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
                    }`}
                    placeholder="03XXXXXXXXX"
                  />
                  {(shippingErrors.phone || shippingValidation.errors.phone) && (
                    <p id="phone-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
                      {shippingErrors.phone || shippingValidation.errors.phone}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Address Line 1</label>
                <input
                  value={shipping.addressLine1}
                  onChange={(e) => {
                    setShipping({ ...shipping, addressLine1: e.target.value })
                    if (shippingErrors.addressLine1) setShippingErrors((p) => ({ ...p, addressLine1: "" }))
                    shippingValidation.handleChange("addressLine1")
                  }}
                  onBlur={() => shippingValidation.handleBlur("addressLine1")}
                  aria-invalid={!!(shippingErrors.addressLine1 || shippingValidation.errors.addressLine1)}
                  aria-describedby={(shippingErrors.addressLine1 || shippingValidation.errors.addressLine1) ? "addressLine1-error" : undefined}
                  className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${
                    (shippingErrors.addressLine1 || shippingValidation.errors.addressLine1)
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      : shippingValidation.getFieldState("addressLine1") === "valid" && shipping.addressLine1
                        ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        : "border-border focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
                  }`}
                  placeholder="House #, Street"
                />
                {(shippingErrors.addressLine1 || shippingValidation.errors.addressLine1) && (
                  <p id="addressLine1-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
                    {shippingErrors.addressLine1 || shippingValidation.errors.addressLine1}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">Address Line 2 <span className="text-muted-foreground">(optional)</span></label>
                <input
                  value={shipping.addressLine2}
                  onChange={(e) => {
                    setShipping({ ...shipping, addressLine2: e.target.value })
                    if (shippingErrors.addressLine2) setShippingErrors((p) => ({ ...p, addressLine2: "" }))
                  }}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
                  placeholder="Area / Landmark"
                />
                {shippingErrors.addressLine2 && <p className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{shippingErrors.addressLine2}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium">City</label>
                  <input
                    value={shipping.city}
                    onChange={(e) => {
                      setShipping({ ...shipping, city: e.target.value })
                      if (shippingErrors.city) setShippingErrors((p) => ({ ...p, city: "" }))
                      shippingValidation.handleChange("city")
                    }}
                    onBlur={() => shippingValidation.handleBlur("city")}
                    aria-invalid={!!(shippingErrors.city || shippingValidation.errors.city)}
                    aria-describedby={(shippingErrors.city || shippingValidation.errors.city) ? "city-error" : undefined}
                    className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${
                      (shippingErrors.city || shippingValidation.errors.city)
                        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : shippingValidation.getFieldState("city") === "valid" && shipping.city
                          ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          : "border-border focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
                    }`}
                    placeholder="Karachi"
                  />
                  {(shippingErrors.city || shippingValidation.errors.city) && (
                    <p id="city-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
                      {shippingErrors.city || shippingValidation.errors.city}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">Province</label>
                  <select
                    value={shipping.province}
                    onChange={(e) => {
                      setShipping({ ...shipping, province: e.target.value })
                      if (shippingErrors.province) setShippingErrors((p) => ({ ...p, province: "" }))
                      shippingValidation.handleChange("province")
                    }}
                    onBlur={() => shippingValidation.handleBlur("province")}
                    aria-invalid={!!(shippingErrors.province || shippingValidation.errors.province)}
                    aria-describedby={(shippingErrors.province || shippingValidation.errors.province) ? "province-error" : undefined}
                    className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${
                      (shippingErrors.province || shippingValidation.errors.province)
                        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : shippingValidation.getFieldState("province") === "valid" && shipping.province
                          ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          : "border-border focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
                    }`}
                  >
                    <option value="">Select</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {(shippingErrors.province || shippingValidation.errors.province) && (
                    <p id="province-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
                      {shippingErrors.province || shippingValidation.errors.province}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">Postal Code <span className="text-muted-foreground">(optional)</span></label>
                  <input
                    value={shipping.postalCode}
                    onChange={(e) => {
                      setShipping({ ...shipping, postalCode: e.target.value })
                      if (shippingErrors.postalCode) setShippingErrors((p) => ({ ...p, postalCode: "" }))
                      shippingValidation.handleChange("postalCode")
                    }}
                    onBlur={() => shippingValidation.handleBlur("postalCode")}
                    aria-invalid={!!(shippingErrors.postalCode || shippingValidation.errors.postalCode)}
                    aria-describedby={(shippingErrors.postalCode || shippingValidation.errors.postalCode) ? "postalCode-error" : undefined}
                    className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${
                      (shippingErrors.postalCode || shippingValidation.errors.postalCode)
                        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : shippingValidation.getFieldState("postalCode") === "valid" && shipping.postalCode
                          ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          : "border-border focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
                    }`}
                    placeholder="54000"
                  />
                  {(shippingErrors.postalCode || shippingValidation.errors.postalCode) && (
                    <p id="postalCode-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
                      {shippingErrors.postalCode || shippingValidation.errors.postalCode}
                    </p>
                  )}
                </div>
              </div>
              {user && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="rounded border-border text-brand-forest focus:ring-brand-forest" />
                  Save this address for future orders
                </label>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleShippingContinue}
                className="flex items-center gap-2 rounded-full bg-brand-forest px-8 py-3 text-sm font-medium text-white hover:bg-brand-forest/90"
              >
                Continue to Payment <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mx-auto max-w-2xl">
            <h2 className="font-heading text-2xl font-bold text-brand-forest">Payment Method</h2>

            <div className="mt-6 grid gap-3">
              {PAYMENT_METHODS.map((pm) => {
                const disabled = pm.id === "cod" && !codAllowed
                return (
                  <button
                    key={pm.id}
                    onClick={() => {
                      if (disabled) return
                      setPaymentMethod(pm.id)
                      if (pm.id === "cod") {
                        setProofFile(null)
                        setProofPreview(null)
                        setTransactionRef("")
                      }
                    }}
                    disabled={disabled}
                    className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      disabled
                        ? "border-border opacity-50 cursor-not-allowed"
                        : paymentMethod === pm.id
                          ? "border-brand-forest bg-brand-forest/5"
                          : "border-border hover:border-brand-forest/50"
                    }`}
                  >
                    <div className={`rounded-full p-2 ${paymentMethod === pm.id ? "bg-brand-forest text-white" : "bg-muted text-muted-foreground"}`}>
                      <pm.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{pm.label}</p>
                      <p className="text-sm text-muted-foreground">{pm.description}</p>
                      {disabled && (
                        <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          COD is only available in Karachi. Your shipping city is: {shipping.city || "not set"}
                        </p>
                      )}
                    </div>
                    {paymentMethod === pm.id && <Check className="h-5 w-5 text-brand-forest" />}
                  </button>
                )
              })}
            </div>

            {paymentMethod === "bank_transfer" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-xl border border-border p-6">
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-brand-forest">Bank Account Details</p>
                  <p>Bank: {bankDetails.bank}</p>
                  <p>Account Name: {bankDetails.accountName}</p>
                  <p>Account #: {bankDetails.accountNumber}</p>
                  <p>IBAN: {bankDetails.iban}</p>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium">Transaction Reference (optional)</label>
                  <input value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-brand-forest focus:outline-none" placeholder="e.g. TID123456" />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium">Upload Payment Proof *</label>
                  <div className="mt-1 flex items-center gap-4">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted">
                      <Upload className="h-4 w-4" />
                      {proofFile ? "Change File" : "Choose File"}
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="hidden" />
                    </label>
                    {proofFile && <span className="text-sm text-muted-foreground">{proofFile.name}</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or PDF. Max 5MB.</p>
                  {proofPreview && (
                    <div className="relative mt-2 h-32 w-32 overflow-hidden rounded-lg border border-border">
                      <Image src={proofPreview} alt="Payment proof preview" fill className="object-cover" sizes="128px" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {paymentMethod === "cod" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-xl border border-border p-6 text-sm">
                <p className="font-medium text-brand-forest">Cash on Delivery</p>
                <p className="mt-2 text-muted-foreground">
                  Pay with cash when your order is delivered to your address in Karachi.
                  No advance payment or proof upload needed.
                </p>
              </motion.div>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(0)} className="flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => { if (canContinue()) setStep(2) }}
                disabled={!canContinue()}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-forest px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                Continue to Review <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mx-auto max-w-2xl">
            <h2 className="font-heading text-2xl font-bold text-brand-forest">Review Your Order</h2>

            <div className="mt-6 space-y-6">
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-brand-forest">Shipping To</h3>
                  <button onClick={() => setStep(0)} className="text-xs text-muted-foreground underline">Edit</button>
                </div>
                <p className="mt-2 text-sm">{shipping.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {shipping.addressLine1}
                  {shipping.addressLine2 && `, ${shipping.addressLine2}`}
                  <br />
                  {shipping.city}, {shipping.province}
                  {shipping.postalCode && ` - ${shipping.postalCode}`}
                </p>
                <p className="text-sm text-muted-foreground">{shipping.phone}</p>
              </div>

              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-brand-forest">Payment Method</h3>
                  <button onClick={() => setStep(1)} className="text-xs text-muted-foreground underline">Edit</button>
                </div>
                <p className="mt-2 text-sm capitalize">{paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer"}</p>
              </div>

              <div className="rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-brand-forest">Items ({items.length})</h3>
                <ul className="mt-3 space-y-3">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-3">
                      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        {item.image && <Image src={item.image} alt={item.product.name} fill className="object-cover" sizes="48px" />}
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-medium">{item.product.name}</p>
                        {item.variant && (
                          <p className="text-xs text-muted-foreground">
                            {[item.variant.size, item.variant.color].filter(Boolean).join(" / ")}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium">Rs. {(item.price_at_time * item.quantity).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium">Order Notes <span className="text-muted-foreground">(optional)</span></label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-brand-forest focus:outline-none" placeholder="Any special instructions?" />
              </div>

              <div className="rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-brand-forest">Order Summary</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shippingCost === 0 ? <span className="text-green-600">Free</span> : `Rs. ${shippingCost}`}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-medium">
                    <span>Total</span>
                    <span className="text-brand-forest">Rs. {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={placeOrder}
                disabled={creating}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-forest px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {creating ? "Placing Order..." : `Place Order - Rs. ${total.toLocaleString()}`}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && orderResult && (
          <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-4 font-heading text-2xl font-bold text-brand-forest">Order Placed!</h2>
            <p className="mt-2 text-lg font-medium text-brand-terracotta">
              Order #{orderResult.orderNumber}
            </p>

            <div className="mt-6 space-y-4">
              {paymentMethod === "cod" ? (
                <p className="text-sm text-muted-foreground">
                  Your order has been placed. You will pay cash on delivery when your order arrives in Karachi.
                  We will confirm your order shortly.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    We have received your order and payment proof. We will verify your payment within 2-4 hours.
                    You will receive a confirmation once verified.
                  </p>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-left text-sm">
                    <p className="font-medium text-brand-forest">Bank Transfer Details</p>
                    <p className="mt-1 text-muted-foreground">
                      Bank: {bankDetails.bank}<br />
                      Account: {bankDetails.accountName}<br />
                      Account #: {bankDetails.accountNumber}<br />
                      IBAN: {bankDetails.iban}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {user && (
                <Link href="/account/orders" className="rounded-full bg-brand-forest px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-forest/90">
                  View My Orders
                </Link>
              )}
              <Link href="/shop" className="rounded-full border border-border px-8 py-3 text-sm font-medium transition-colors hover:bg-muted">
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}