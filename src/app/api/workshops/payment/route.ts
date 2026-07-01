import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { workshopPaymentSchema } from "@/lib/validations"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(`workshop-payment:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const parsed = workshopPaymentSchema.safeParse(body)
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 })
    }

    const { registrationId, transactionRef } = parsed.data
    const supabase = await createClient()

    const { data: registration, error: regErr } = await supabase
      .from("workshop_registrations")
      .select("id, workshop_id, guest_email, status, payment_status")
      .eq("id", registrationId)
      .single()

    if (regErr || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    if (registration.status !== "awaiting_payment") {
      return NextResponse.json(
        { error: "This registration is not awaiting payment" },
        { status: 400 }
      )
    }

    const { data: workshop, error: wErr } = await supabase
      .from("workshops")
      .select("id, fee, title")
      .eq("id", registration.workshop_id)
      .single()

    if (wErr || !workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 })
    }

    // Check for existing submitted payment
    const { data: existingPayment } = await supabase
      .from("workshop_payments")
      .select("id")
      .eq("registration_id", registrationId)
      .eq("status", "submitted")
      .maybeSingle()

    if (existingPayment) {
      return NextResponse.json(
        { error: "A payment proof has already been submitted for this registration" },
        { status: 400 }
      )
    }

    // Create payment record (proof_url will be set via separate upload)
    const { data: payment, error: payErr } = await supabase
      .from("workshop_payments")
      .insert({
        registration_id: registrationId,
        amount: workshop.fee,
        method: "bank_transfer",
        status: "submitted",
        proof_url: null, // Will be updated after file upload
        transaction_ref: transactionRef || null,
      })
      .select("id")
      .single()

    if (payErr) {
      console.error("Payment creation error:", payErr)
      return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 })
    }

    // Update registration status
    await supabase
      .from("workshop_registrations")
      .update({
        status: "payment_submitted",
        payment_status: "submitted",
      })
      .eq("id", registrationId)

    // Create admin notification
    await supabase.from("admin_notifications").insert({
      type: "workshop_payment_submitted",
      title: `Payment proof uploaded for ${workshop.title}`,
      message: `Registration from ${registration.guest_email}. Rs. ${workshop.fee} awaiting review.`,
      metadata: { registration_id: registrationId, payment_id: payment.id, workshop_id: registration.workshop_id },
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      message: "Payment proof submitted. Awaiting admin verification.",
    })
  } catch (err) {
    console.error("Workshop payment error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
