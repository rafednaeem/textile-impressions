import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { whatsappNumber } from "@/lib/constants"

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

  const message = `Incubator Enquiry: ${name} | ${phone} | Craft: ${craft_type}`
  return NextResponse.json({
    whatsappUrl: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
  })
}
