import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { sendOrderStatusEmail } from "@/lib/email/integrations"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, user, error } = await requireAdmin()
  if (error) return error

  const { error: updateError } = await supabase
    .from("payments")
    .update({ status: "verified", verified_at: new Date().toISOString(), verified_by: user.id })
    .eq("order_id", id)

  if (updateError) return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })

  await supabase.from("orders").update({ status: "payment_verified" }).eq("id", id)
  await supabase.from("order_timeline").insert({
    order_id: id,
    status: "payment_verified",
    note: "Payment verified by admin",
    created_by: user.id,
  })

  sendOrderStatusEmail(id, "payment_verified").catch((err) =>
    console.error("[verify-payment] Failed to send email:", err)
  )

  return NextResponse.json({ success: true })
}
