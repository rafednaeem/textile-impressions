import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"
import {
  WORKSHOP_MEDIA_BUCKET,
  validateMediaMetadata,
  mediaFolder,
  type MediaType,
} from "@/lib/media"

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const fileName = String(body.fileName || "")
    const mimeType = String(body.mimeType || "")
    const size = Number(body.size || 0)
    const mediaType = (body.mediaType as MediaType) || "image"

    if (!fileName || !mimeType || !size) {
      return NextResponse.json(
        { error: "Missing fileName, mimeType, or size" },
        { status: 400 }
      )
    }

    if (mediaType !== "image" && mediaType !== "video") {
      return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 })
    }

    const validation = validateMediaMetadata(fileName, mimeType, size, mediaType)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const ext = fileName.split(".").pop()
    const folder = mediaFolder(mediaType, "workshops")
    const storagePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data: signedData, error: signedError } = await supabase.storage
      .from(WORKSHOP_MEDIA_BUCKET)
      .createSignedUploadUrl(storagePath)

    if (signedError || !signedData?.signedUrl || !signedData?.token) {
      console.error("[workshop-media signed upload] Supabase error:", signedError)
      return NextResponse.json(
        { error: signedError?.message || "Failed to create upload URL" },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage.from(WORKSHOP_MEDIA_BUCKET).getPublicUrl(storagePath)

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      path: storagePath,
      url: urlData.publicUrl,
      media_type: mediaType,
    })
  } catch (err) {
    console.error("[workshop-media signed upload] Unexpected error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create upload URL" },
      { status: 500 }
    )
  }
}
