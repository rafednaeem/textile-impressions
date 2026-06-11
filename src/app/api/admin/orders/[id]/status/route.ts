import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const { status } = body
  if (!status) return NextResponse.json({ error: "Status is required" }, { status: 400 })

  const { error } = await supabase.from("orders").update({ status }).eq("id", id)
  if (error) return NextResponse.json({ error: "Failed to update status" }, { status: 500 })

  await supabase.from("order_timeline").insert({
    order_id: id,
    status,
    note: `Status changed to ${status.replace("_", " ")}`,
    created_by: user.id,
  })

  return NextResponse.json({ success: true })
}
