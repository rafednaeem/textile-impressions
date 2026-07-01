import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { z } from "zod"

const paymentActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
})

interface Props {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: Props) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error
    const { supabase, user } = auth

    const { id } = await params
    const body = await request.json()
    const parsed = paymentActionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { action, reason } = parsed.data

    // Get the registration
    const { data: registration, error: regErr } = await supabase
      .from("workshop_registrations")
      .select("id, workshop_id, guest_name, guest_email, status")
      .eq("id", id)
      .single()

    if (regErr || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    if (registration.status !== "payment_submitted" && registration.status !== "payment_under_review") {
      return NextResponse.json(
        { error: "This registration does not have a pending payment" },
        { status: 400 }
      )
    }

    // Get the payment
    const { data: payment, error: payErr } = await supabase
      .from("workshop_payments")
      .select("id, amount")
      .eq("registration_id", id)
      .eq("status", "submitted")
      .single()

    if (payErr || !payment) {
      return NextResponse.json({ error: "No submitted payment found" }, { status: 404 })
    }

    // Get workshop info
    const { data: workshop } = await supabase
      .from("workshops")
      .select("title, fee")
      .eq("id", registration.workshop_id)
      .single()

    if (action === "approve") {
      // Update payment status
      await supabase
        .from("workshop_payments")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .eq("id", payment.id)

      // Update registration
      await supabase
        .from("workshop_registrations")
        .update({
          status: "confirmed",
          payment_status: "verified",
        })
        .eq("id", id)

      // Notification
      await supabase.from("admin_notifications").insert({
        type: "workshop_payment_approved",
        title: `Payment approved for ${registration.guest_name}`,
        message: `Rs. ${payment.amount} verified for ${workshop?.title || "workshop"}. Registration confirmed.`,
        metadata: { registration_id: id, payment_id: payment.id, workshop_id: registration.workshop_id },
      })

      return NextResponse.json({ success: true, message: "Payment approved. Registration confirmed." })
    } else {
      // Reject
      await supabase
        .from("workshop_payments")
        .update({
          status: "rejected",
          rejection_reason: reason || "Payment could not be verified",
        })
        .eq("id", payment.id)

      await supabase
        .from("workshop_registrations")
        .update({
          status: "awaiting_payment",
          payment_status: "rejected",
        })
        .eq("id", id)

      // Notification
      await supabase.from("admin_notifications").insert({
        type: "workshop_payment_rejected",
        title: `Payment rejected for ${registration.guest_name}`,
        message: `Rs. ${payment.amount} rejected for ${workshop?.title || "workshop"}. Reason: ${reason || "Not specified"}`,
        metadata: { registration_id: id, payment_id: payment.id, workshop_id: registration.workshop_id },
      })

      return NextResponse.json({ success: true, message: "Payment rejected." })
    }
  } catch (err) {
    console.error("Workshop payment action error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
