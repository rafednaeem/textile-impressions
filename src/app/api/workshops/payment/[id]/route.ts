import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"

interface Props {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(`workshop-payment-update:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { id } = await params
    const body = await request.json()
    const { proofUrl } = body

    if (!proofUrl || typeof proofUrl !== "string") {
      return NextResponse.json({ error: "proofUrl is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: payment, error: payErr } = await supabase
      .from("workshop_payments")
      .select("id, registration_id")
      .eq("id", id)
      .single()

    if (payErr || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const { error: updateErr } = await supabase
      .from("workshop_payments")
      .update({ proof_url: proofUrl })
      .eq("id", id)

    if (updateErr) {
      return NextResponse.json({ error: "Failed to update payment" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Workshop payment update error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
