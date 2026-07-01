import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error
    const { supabase } = auth

    const { searchParams } = new URL(request.url)
    const workshopId = searchParams.get("workshopId")
    const status = searchParams.get("status")
    const paymentStatus = searchParams.get("paymentStatus")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    let query = supabase
      .from("workshop_registrations")
      .select(`
        *,
        workshop:workshops(id, title, fee, format, date_start, online_meeting_url, location_address),
        payments:workshop_payments(*)
      `, { count: "exact" })
      .order("registered_at", { ascending: false })

    if (workshopId) {
      query = query.eq("workshop_id", workshopId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (paymentStatus) {
      query = query.eq("payment_status", paymentStatus)
    }

    if (search) {
      query = query.or(`guest_name.ilike.%${search}%,guest_email.ilike.%${search}%,guest_phone.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: registrations, error, count } = await query

    if (error) {
      console.error("Admin registrations fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
    }

    return NextResponse.json({
      registrations: registrations || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (err) {
    console.error("Admin registrations error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
