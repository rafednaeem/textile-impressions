import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { status } = body
  if (!status) return NextResponse.json({ error: "Status is required" }, { status: 400 })

  const { error: updateError } = await supabase.from("orders").update({ status }).eq("id", id)
  if (updateError) return NextResponse.json({ error: "Failed to update status" }, { status: 500 })

  await supabase.from("order_timeline").insert({
    order_id: id,
    status,
    note: `Status changed to ${status.replace("_", " ")}`,
  })

  return NextResponse.json({ success: true })
}
