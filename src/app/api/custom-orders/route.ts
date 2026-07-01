import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getServiceRoleClient } from "@/lib/supabase/service-role"
import { extractSettings } from "@/lib/settings"
import { customOrderSchema } from "@/lib/validations"
import { sendCustomOrderConfirmationEmail } from "@/lib/email/integrations"

export async function POST(request: Request) {
  const supabase = await createClient()
  const formData = await request.formData()

  const raw: Record<string, string> = {}
  for (const key of ["name", "email", "phone", "garment_type", "fabric_preference", "color_preference", "size", "quantity", "budget_range", "deadline", "notes"]) {
    raw[key] = String(formData.get(key) || "")
  }

  const parsed = customOrderSchema.safeParse(raw)
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 })
  }

  const { name, email, phone, garment_type, fabric_preference, color_preference, size, quantity, budget_range, deadline, notes } = parsed.data

  const referenceImages: string[] = []
  const files = formData.getAll("reference_images").filter((file): file is File => file instanceof File && file.size > 0)

  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg"
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from("custom-orders").upload(path, file, {
      contentType: file.type || "image/jpeg",
    })
    if (!error && data?.path) referenceImages.push(data.path)
  }

  const serviceRole = getServiceRoleClient()

  const { data: inserted, error } = await serviceRole.from("custom_orders").insert({
    name,
    email,
    phone,
    garment_type,
    fabric_preference: String(formData.get("fabric_preference") || "") || null,
    color_preference: String(formData.get("color_preference") || "") || null,
    size: String(formData.get("size") || "") || null,
    quantity: Number(formData.get("quantity") || 1),
    budget_range: budget_range || null,
    deadline: deadline || null,
    notes: String(formData.get("notes") || "") || null,
    reference_images: referenceImages,
    status: "new",
  }).select("id").single()

  if (error) {
    return NextResponse.json({ error: "Failed to submit custom order" }, { status: 500 })
  }

  if (inserted?.id && email) {
    sendCustomOrderConfirmationEmail(inserted.id).catch((err) =>
      console.error("[custom-orders] Failed to send confirmation email:", err)
    )
  }

  const { data: settingsData } = await supabase.from("site_settings").select("key, value")
  const s = extractSettings(settingsData)
  const wa = s.store_whatsapp || "923001234567"

  const message = `Custom Order Request: ${garment_type} | Budget: ${budget_range || "Not specified"} | Timeline: ${deadline || "Flexible"}`
  return NextResponse.json({
    whatsappUrl: `https://wa.me/${wa}?text=${encodeURIComponent(message)}`,
  })
}
