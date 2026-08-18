import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const { supabase, user } = admin
  console.log("[WebsiteImageUpload] Admin upload attempt by:", user?.id)

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"]
    const maxSize = 5 * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, AVIF" },
        { status: 400 }
      )
    }

    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Max 5MB" }, { status: 400 })
    }

    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif",
    }
    const ext = mimeToExt[file.type] || file.name.split(".").pop() || "jpg"
    const fileName = `website/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from("website-content")
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error("[WebsiteImageUpload] Storage upload error:", uploadError)
      let message = uploadError.message
      if (message.toLowerCase().includes("bucket") || message.toLowerCase().includes("not found")) {
        message = `${message}. Make sure migration 00014_website_content.sql has been applied and the 'website-content' bucket exists.`
      }
      return NextResponse.json(
        { error: `Upload failed: ${message}` },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage.from("website-content").getPublicUrl(fileName)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error("[WebsiteImageUpload] Unexpected error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 })
  }
}
