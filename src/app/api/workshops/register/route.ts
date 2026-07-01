import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { workshopRegisterSchema } from "@/lib/validations"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(`workshop-register:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const parsed = workshopRegisterSchema.safeParse(body)
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 })
    }

    const { workshopId, guestName, guestEmail, guestPhone } = parsed.data

    const supabase = await createClient()

    const { data: workshop, error: wErr } = await supabase
      .from("workshops")
      .select("id, max_seats, seats_remaining, status")
      .eq("id", workshopId)
      .eq("status", "published")
      .single()

    if (wErr || !workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 })
    }

    if (workshop.seats_remaining !== null && workshop.seats_remaining <= 0) {
      return NextResponse.json({ error: "This workshop is fully booked" }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from("workshop_registrations")
      .select("id")
      .eq("workshop_id", workshopId)
      .eq("guest_email", guestEmail)
      .in("status", ["registered", "waitlisted"])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "You are already registered for this workshop" }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error: regErr } = await supabase.from("workshop_registrations").insert({
      workshop_id: workshopId,
      user_id: user?.id || null,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone || null,
      status: "registered",
    })

    if (regErr) {
      console.error("Registration error:", regErr)
      return NextResponse.json({ error: "Failed to register" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Registration confirmed" })
  } catch (err) {
    console.error("Workshop registration error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}