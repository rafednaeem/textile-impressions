import { NextResponse } from "next/server"
import { getServiceRoleClient } from "@/lib/supabase/service-role"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    const maxSize = 5 * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, PDF" },
        { status: 400 }
      )
    }

    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Max 5MB" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()
    const folder = `checkout/${Date.now()}-${Math.random().toString(36).slice(2)}`
    const fileName = `${folder}/${Date.now()}.${ext}`

    const serviceRole = getServiceRoleClient()
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await serviceRole.storage
      .from("payment-proofs")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    const { data: signedData } = await serviceRole.storage
      .from("payment-proofs")
      .createSignedUrl(fileName, 60 * 60 * 24 * 90)

    if (!signedData?.signedUrl) {
      return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 })
    }

    return NextResponse.json({ url: signedData.signedUrl })
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
