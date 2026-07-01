import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "misc"

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"]
    const maxSize = 5 * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: JPG, PNG, WebP, AVIF" }, { status: 400 })
    }

    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Max 5MB" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) return NextResponse.json({ error: "Upload failed" }, { status: 500 })

    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
