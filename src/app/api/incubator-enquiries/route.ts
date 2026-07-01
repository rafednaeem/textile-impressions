import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { extractSettings } from "@/lib/settings"

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { name, phone, craft_type, description } = body

  if (!name || !phone || !craft_type) {
    return NextResponse.json({ error: "Name, phone, and craft type are required" }, { status: 400 })
  }

  const { error } = await supabase.from("incubator_enquiries").insert({
    name,
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
