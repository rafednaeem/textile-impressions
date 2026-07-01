import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { data, error: fetchError } = await supabase
    .from("workshops")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !data) return NextResponse.json({ error: "Workshop not found" }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const {
    title, description, short_description, instructor_name, cover_image_url,
    format, level, date_start, date_end, duration_minutes,
    location_address, online_meeting_platform, online_meeting_url,
    max_seats, fee, materials_included, materials_list,
    status, is_featured,
  } = body

  const update: Record<string, unknown> = {}
  if (title !== undefined) update.title = title.trim()
  if (description !== undefined) update.description = description || null
  if (short_description !== undefined) update.short_description = short_description || null
  if (instructor_name !== undefined) update.instructor_name = instructor_name || "Textile Impressions"
  if (cover_image_url !== undefined) update.cover_image_url = cover_image_url || null
  if (format !== undefined) update.format = format
  if (level !== undefined) update.level = level
  if (date_start !== undefined) update.date_start = date_start || null
  if (date_end !== undefined) update.date_end = date_end || null
  if (duration_minutes !== undefined) update.duration_minutes = duration_minutes || null
  if (location_address !== undefined) update.location_address = location_address || null
  if (online_meeting_platform !== undefined) update.online_meeting_platform = online_meeting_platform || null
  if (online_meeting_url !== undefined) update.online_meeting_url = online_meeting_url || null
  if (max_seats !== undefined) {
    update.max_seats = max_seats || null
    const { data: current } = await supabase.from("workshops").select("max_seats, seats_remaining").eq("id", id).single()
    if (current && current.seats_remaining !== null && current.max_seats !== null && max_seats) {
      const diff = max_seats - current.max_seats
      update.seats_remaining = Math.max(0, (current.seats_remaining ?? 0) + diff)
    } else if (max_seats) {
      update.seats_remaining = max_seats
    }
  }
  if (fee !== undefined) update.fee = fee || 0
  if (materials_included !== undefined) update.materials_included = materials_included
  if (materials_list !== undefined) update.materials_list = materials_list || null
  if (status !== undefined) update.status = status
  if (is_featured !== undefined) update.is_featured = is_featured

  update.updated_at = new Date().toISOString()

  const { error: updateError } = await supabase
    .from("workshops")
    .update(update)
    .eq("id", id)

  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json({ error: "A workshop with this title already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update workshop" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { error: deleteError } = await supabase.from("workshops").delete().eq("id", id)
  if (deleteError) return NextResponse.json({ error: "Failed to delete workshop" }, { status: 500 })

  return NextResponse.json({ ok: true })
}
