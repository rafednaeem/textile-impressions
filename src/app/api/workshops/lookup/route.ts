import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { workshopLookupSchema } from "@/lib/validations"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(`workshop-lookup:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const parsed = workshopLookupSchema.safeParse(body)
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 })
    }

    const { email, workshopId } = parsed.data
    const supabase = await createClient()

    let query = supabase
      .from("workshop_registrations")
      .select(`
        id, status, payment_status, registered_at, guest_name, guest_phone,
        workshop:workshops(id, title, slug, format, date_start, date_end, location_address, online_meeting_url, online_meeting_platform, fee)
      `)
      .eq("guest_email", email)
      .order("registered_at", { ascending: false })

    if (workshopId) {
      query = query.eq("workshop_id", workshopId)
    }

    const { data: registrations, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to look up registrations" }, { status: 500 })
    }

    // Only return confirmed registrations with meeting links for online/hybrid
    const sanitized = (registrations || []).map((reg: Record<string, unknown>) => {
      const workshop = reg.workshop as Record<string, unknown> | null
      const isConfirmed = reg.status === "confirmed"
      const isOnline = workshop && (workshop.format === "online" || workshop.format === "hybrid")

      return {
        id: reg.id,
        status: reg.status,
        payment_status: reg.payment_status,
        registered_at: reg.registered_at,
        guest_name: reg.guest_name,
        workshop: workshop ? {
          id: workshop.id,
          title: workshop.title,
          slug: workshop.slug,
          format: workshop.format,
          date_start: workshop.date_start,
          date_end: workshop.date_end,
          location_address: workshop.location_address,
          online_meeting_platform: workshop.online_meeting_platform,
          meeting_link: isConfirmed && isOnline ? workshop.online_meeting_url : null,
        } : null,
      }
    })

    return NextResponse.json({ registrations: sanitized })
  } catch (err) {
    console.error("Workshop lookup error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
