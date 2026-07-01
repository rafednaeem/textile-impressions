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
      .select("id, max_seats, seats_remaining, status, fee, format, title")
      .eq("id", workshopId)
      .eq("status", "published")
      .single()

    if (wErr || !workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 })
    }

    const isPaid = workshop.fee > 0

    const { data: existing } = await supabase
      .from("workshop_registrations")
      .select("id")
      .eq("workshop_id", workshopId)
      .eq("guest_email", guestEmail)
      .in("status", [
        "pending", "awaiting_payment", "payment_submitted", "payment_under_review",
        "confirmed", "waitlisted",
      ])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "You are already registered for this workshop" }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    const seatsAvailable = workshop.seats_remaining !== null && workshop.seats_remaining > 0
    const registrationStatus = seatsAvailable ? (isPaid ? "awaiting_payment" : "confirmed") : "waitlisted"
    const paymentStatus = isPaid && seatsAvailable ? "awaiting" : "none"

    const { data: registration, error: regErr } = await supabase
      .from("workshop_registrations")
      .insert({
        workshop_id: workshopId,
        user_id: user?.id || null,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        status: registrationStatus,
        payment_status: paymentStatus,
        waitlisted_at: registrationStatus === "waitlisted" ? new Date().toISOString() : null,
      })
      .select("id, status")
      .single()

    if (regErr) {
      console.error("Registration error:", regErr)
      return NextResponse.json({ error: "Failed to register" }, { status: 500 })
    }

    // Create admin notification
    await supabase.from("admin_notifications").insert({
      type: registrationStatus === "waitlisted" ? "workshop_waitlist" : "workshop_new_registration",
      title: registrationStatus === "waitlisted"
        ? `New waitlist: ${guestName} for ${workshop.title}`
        : `New registration: ${guestName} for ${workshop.title}`,
      message: isPaid
        ? `Payment of Rs. ${workshop.fee} awaiting. Email: ${guestEmail}`
        : `Free registration confirmed. Email: ${guestEmail}`,
      metadata: { registration_id: registration.id, workshop_id: workshopId },
    })

    return NextResponse.json({
      success: true,
      registrationId: registration.id,
      status: registration.status,
      message: registrationStatus === "waitlisted"
        ? "Workshop is full. You have been added to the waiting list."
        : isPaid
          ? "Registration received. Please complete payment to confirm your spot."
          : "Registration confirmed!",
    })
  } catch (err) {
    console.error("Workshop registration error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
