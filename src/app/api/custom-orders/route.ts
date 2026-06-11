import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { whatsappNumber } from "@/lib/constants"

export async function POST(request: Request) {
  const supabase = await createClient()
  const formData = await request.formData()

  const name = String(formData.get("name") || "")
  const phone = String(formData.get("phone") || "")
  const garment_type = String(formData.get("garment_type") || "")
  const budget_range = String(formData.get("budget_range") || "")
  const deadline = String(formData.get("deadline") || "")

  if (!name || !phone || !garment_type) {
    return NextResponse.json({ error: "Name, phone, and garment type are required" }, { status: 400 })
  }

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

  const { error } = await supabase.from("custom_orders").insert({
    name,
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
  })

  if (error) {
    return NextResponse.json({ error: "Failed to submit custom order" }, { status: 500 })
  }

  const message = `Custom Order Request: ${garment_type} | Budget: ${budget_range || "Not specified"} | Timeline: ${deadline || "Flexible"}`
  return NextResponse.json({
    whatsappUrl: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
  })
}
