import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const status = searchParams.get("status")

  let query = supabase
    .from("workshops")
    .select("*", { count: "exact" })

  if (search) query = query.ilike("title", `%${search}%`)
  if (status) query = query.eq("status", status)

  const { data: workshops, count, error: queryError } = await query
    .order("created_at", { ascending: false })

  if (queryError) return NextResponse.json({ error: "Failed to fetch workshops" }, { status: 500 })

  return NextResponse.json({ workshops, count })
}

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const {
    title, description, short_description, instructor_name,
    format, level, date_start, date_end, duration_minutes,
    location_address, online_meeting_platform, online_meeting_url,
    max_seats, fee, materials_included, materials_list,
    status, is_featured,
  } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  }

  const slug = slugify(title.trim())

  const { data: workshop, error: insertError } = await supabase
    .from("workshops")
    .insert({
      title: title.trim(),
      slug,
      description: description || null,
      short_description: short_description || null,
      instructor_name: instructor_name || "Textile Impressions",
      format: format || "in_person",
      level: level || "all_levels",
      date_start: date_start || null,
      date_end: date_end || null,
      duration_minutes: duration_minutes || null,
      location_address: location_address || null,
      online_meeting_platform: online_meeting_platform || null,
      online_meeting_url: online_meeting_url || null,
      max_seats: max_seats || null,
      seats_remaining: max_seats || null,
      fee: fee || 0,
      materials_included: materials_included || false,
      materials_list: materials_list || null,
      status: status || "draft",
      is_featured: is_featured || false,
    })
    .select("id")
    .single()

  if (insertError) {
    console.error("Supabase error creating workshop:", insertError)
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "A workshop with this title already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: `Failed to create workshop: ${insertError.message}` }, { status: 500 })
  }

  return NextResponse.json({ id: workshop.id })
}
