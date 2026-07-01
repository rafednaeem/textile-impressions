import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { workshopAdminUpdateSchema } from "@/lib/validations"
import { sendWorkshopRegistrationEmail } from "@/lib/email/integrations"

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Props) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error
    const { supabase } = auth

    const { id } = await params

    const { data: registration, error } = await supabase
      .from("workshop_registrations")
      .select(`
        *,
        workshop:workshops(id, title, fee, format, date_start, date_end, online_meeting_url, online_meeting_platform, location_address, instructor_name),
        payments:workshop_payments(*)
      `)
      .eq("id", id)
      .single()

    if (error || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({ registration })
  } catch (err) {
    console.error("Admin registration fetch error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error
    const { supabase, user } = auth

    const { id } = await params
    const body = await request.json()
    const parsed = workshopAdminUpdateSchema.safeParse(body)

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 })
    }

    const { status, adminNotes, cancellationReason } = parsed.data

    const { data: existing, error: fetchErr } = await supabase
      .from("workshop_registrations")
      .select("id, status, workshop_id, guest_name, guest_email")
      .eq("id", id)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (status) {
      updateData.status = status

      if (status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString()
        if (cancellationReason) updateData.cancellation_reason = cancellationReason
      }

      if (status === "confirmed") {
        updateData.payment_status = "verified"
      }

      if (status === "attended") {
        updateData.checked_in_at = new Date().toISOString()
      }
    }

    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes
    }

    const { error: updateErr } = await supabase
      .from("workshop_registrations")
      .update(updateData)
      .eq("id", id)

    if (updateErr) {
      console.error("Registration update error:", updateErr)
      return NextResponse.json({ error: "Failed to update registration" }, { status: 500 })
    }

    // Fetch workshop title for notification
    const { data: workshop } = await supabase
      .from("workshops")
      .select("title")
      .eq("id", existing.workshop_id)
      .single()

    // Create notification for status changes
    if (status && status !== existing.status) {
      const statusMessages: Record<string, string> = {
        confirmed: `Registration confirmed for ${existing.guest_name}`,
        cancelled: `Registration cancelled for ${existing.guest_name}`,
        attended: `${existing.guest_name} marked as attended`,
        no_show: `${existing.guest_name} marked as no-show`,
        waitlisted: `${existing.guest_name} moved to waitlist`,
      }

      if (statusMessages[status]) {
        await supabase.from("admin_notifications").insert({
          type: `workshop_registration_${status}`,
          title: statusMessages[status],
          message: `Workshop: ${workshop?.title || "Unknown"}`,
          metadata: { registration_id: id, workshop_id: existing.workshop_id },
        })
      }

      // Send email for status changes that have templates
      const emailEvents: Record<string, string> = {
        confirmed: "seat_confirmed",
        cancelled: "cancelled",
        attended: "completed",
      }

      const emailEvent = emailEvents[status]
      if (emailEvent) {
        sendWorkshopRegistrationEmail(id, emailEvent, {
          reason: status === "cancelled" ? cancellationReason : undefined,
        }).catch((err) =>
          console.error("[admin/workshop-registrations] Failed to send email:", err)
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Admin registration update error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
