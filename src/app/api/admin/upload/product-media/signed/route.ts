import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"
import {
  PRODUCT_MEDIA_BUCKET,
  validateMediaFile,
  mediaFolder,
  type MediaType,
} from "@/lib/media"

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const mediaType = (formData.get("media_type") as MediaType) || "image"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (mediaType !== "image" && mediaType !== "video") {
      return NextResponse.json({ error: "Invalid media_type" }, { status: 400 })
    }

    const validation = validateMediaFile(file, mediaType)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const ext = file.name.split(".").pop()
    const folder = mediaFolder(mediaType)
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data: signedData, error: signedError } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .createSignedUploadUrl(fileName)

    if (signedError || !signedData?.signedUrl || !signedData?.token) {
      console.error("[product-media signed upload] Supabase error:", signedError)
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(PRODUCT_MEDIA_BUCKET).getPublicUrl(fileName)

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      path: fileName,
      url: urlData.publicUrl,
      media_type: mediaType,
    })
  } catch (err) {
    console.error("[product-media signed upload] Unexpected error:", err)
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 })
  }
}
