import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  _request: Request,
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

  const { error } = await supabase
    .from("payments")
    .update({ status: "verified", verified_at: new Date().toISOString(), verified_by: user.id })
    .eq("order_id", id)

  if (error) return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })

  await supabase.from("orders").update({ status: "payment_verified" }).eq("id", id)
  await supabase.from("order_timeline").insert({
    order_id: id,
    status: "payment_verified",
    note: "Payment verified by admin",
    created_by: user.id,
  })

  return NextResponse.json({ success: true })
}
