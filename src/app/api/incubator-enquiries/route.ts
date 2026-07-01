import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { extractSettings } from "@/lib/settings"
import { incubatorEnquirySchema } from "@/lib/validations"

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const parsed = incubatorEnquirySchema.safeParse(body)
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 })
  }

  const { name, email, phone, craft_type, description } = parsed.data

  const { error } = await supabase.from("incubator_enquiries").insert({
    name,
    email,
    phone,
    craft_type,
    description: description || null,
    status: "new",
  })

  if (error) {
    return NextResponse.json({ error: "Failed to submit enquiry" }, { status: 500 })
  }

  const { data: settingsData } = await supabase.from("site_settings").select("key, value")
  const s = extractSettings(settingsData)
  const wa = s.store_whatsapp || "923001234567"

  const message = `Incubator Enquiry: ${name} | ${phone} | Craft: ${craft_type}`
  return NextResponse.json({
    whatsappUrl: `https://wa.me/${wa}?text=${encodeURIComponent(message)}`,
  })
}
