import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getServiceRoleClient } from "@/lib/supabase/service-role"
import { rateLimit } from "@/lib/rate-limit"
import { isCodEligible } from "@/lib/constants"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(`orders:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const supabase = await createClient()
    const serviceRole = getServiceRoleClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json()
    const { items, shippingAddress, paymentMethod, notes, guestEmail } = body

    if (!items?.length || !shippingAddress || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!user && !guestEmail) {
      return NextResponse.json({ error: "Email is required for guest checkout" }, { status: 400 })
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

    const enrichedShipping = {
      ...shippingAddress,
      ...(guestEmail ? { guest_email: guestEmail } : {}),
    }

    const { data: _order, error: orderError } = await serviceRole
      .from("orders")
      .insert({
        user_id: user?.id || null,
        status: orderStatus,
        shipping_address: enrichedShipping,
        subtotal,
        shipping_cost: shippingCost,
        total,
        notes: notes || null,
      })
      .select("id, order_number, status")
      .single()

    if (orderError || !_order) {
      console.error("Order insert error:", JSON.stringify(orderError))
      return NextResponse.json({
        error: "Failed to create order",
        details: orderError?.message,
        code: orderError?.code,
        hint: orderError?.hint,
        debug: { hasUser: !!user, userId: user?.id || null, guestEmail: guestEmail || null },
      }, { status: 500 })
    }

    const order = _order as unknown as { id: string; order_number: string; status: string }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    const resolvedItems = await Promise.all(
      items.map(async (item: any) => {
        let productId = item.product_id
        if (!uuidRegex.test(productId)) {
          const { data: product } = await serviceRole
            .from("products")
            .select("id")
            .eq("slug", productId)
            .maybeSingle()
          if (product) {
            productId = product.id
          } else {
            const { data: productByName } = await serviceRole
              .from("products")
              .select("id")
              .eq("name", item.product_name)
              .maybeSingle()
            if (productByName) {
              productId = productByName.id
            }
          }
        }
        return {
          order_id: order.id,
          product_id: productId,
          variant_id: item.variant_id || null,
          product_name: item.product_name,
          product_image: item.product_image || null,
          size: item.size || null,
          color: item.color || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
        }
      })
    )

    const { error: itemsError } = await serviceRole.from("order_items").insert(resolvedItems)
    if (itemsError) {
      console.error("Order items insert error:", JSON.stringify(itemsError))
      await serviceRole.from("orders").delete().eq("id", order.id)
      return NextResponse.json({ error: "Failed to create order items", details: itemsError?.message, code: itemsError?.code }, { status: 500 })
    }

    const { error: timelineError } = await serviceRole.from("order_timeline").insert({
      order_id: order.id,
      status: order.status,
      note: user ? "Order created" : "Guest order created",
      created_by: user?.id || null,
    })
    if (timelineError) {
      console.error("Order timeline insert error:", JSON.stringify(timelineError))
    }

    if (paymentMethod === "bank_transfer") {
      const { error: payErr } = await serviceRole.from("payments").insert({
        order_id: order.id,
        method: "bank_transfer",
        status: "submitted",
        proof_url: body.proofUrl || null,
        transaction_reference: body.transactionReference || null,
      })
      if (payErr) console.error("Payment insert error:", JSON.stringify(payErr))
    } else if (paymentMethod === "cod") {
      const { error: payErr } = await serviceRole.from("payments").insert({
        order_id: order.id,
        method: "cod",
        status: "pending",
      })
      if (payErr) console.error("Payment insert error:", JSON.stringify(payErr))
    }

    if (user) {
      await supabase.from("cart_items").delete().in(
        "product_id",
        items.map((i: any) => i.product_id)
      )
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
    })
  } catch (err: any) {
    console.error("Order creation error:", err?.message, err?.stack)
    return NextResponse.json({ error: "Internal server error", details: err?.message }, { status: 500 })
  }
}
