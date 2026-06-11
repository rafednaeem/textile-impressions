import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { isCodEligible } from "@/lib/constants"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(`orders:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { items, shippingAddress, paymentMethod, notes } = body

    if (!items?.length || !shippingAddress || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (paymentMethod === "cod" && !isCodEligible(shippingAddress.city)) {
      return NextResponse.json({ error: "Cash on Delivery is only available in Karachi" }, { status: 400 })
    }

    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.unit_price * item.quantity,
      0
    )
    const shippingCost = subtotal >= 2000 ? 0 : 200
    const total = subtotal + shippingCost

    const orderStatus = paymentMethod === "cod" ? "cod_pending" : "payment_submitted"

    const { data: _order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: orderStatus,
        shipping_address: shippingAddress,
        subtotal,
        shipping_cost: shippingCost,
        total,
        notes: notes || null,
      })
      .select("id, order_number, status")
      .single()

    if (orderError || !_order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    const order = _order as unknown as { id: string; order_number: string; status: string }

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      product_name: item.product_name,
      product_image: item.product_image || null,
      size: item.size || null,
      color: item.color || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    await supabase.from("order_timeline").insert({
      order_id: order.id,
      status: order.status,
      note: "Order created",
      created_by: user.id,
    })

    if (paymentMethod === "bank_transfer") {
      await supabase.from("payments").insert({
        order_id: order.id,
        method: "bank_transfer",
        status: "submitted",
        proof_url: body.proofUrl || null,
        transaction_reference: body.transactionReference || null,
      })
    } else if (paymentMethod === "cod") {
      await supabase.from("payments").insert({
        order_id: order.id,
        method: "cod",
        status: "pending",
      })
    }

    await supabase.from("cart_items").delete().in(
      "product_id",
      items.map((i: any) => i.product_id)
    )

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
    })
  } catch (err) {
    console.error("Order creation error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
