import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { items, sessionId } = body

    if (!items?.length) {
      return NextResponse.json({ error: "No items to merge" }, { status: 400 })
    }

    const { data: existingCart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    let cartId: string
    if (existingCart) {
      cartId = existingCart.id
    } else {
      const { data: newCart } = await supabase
        .from("carts")
        .insert({ user_id: user.id, session_id: sessionId || null })
        .select("id")
        .single()
      if (!newCart) return NextResponse.json({ error: "Failed to create cart" }, { status: 500 })
      cartId = newCart.id
    }

    for (const item of items) {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("product_id", item.product_id)
        .maybeSingle()

      if (existing) {
        await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + item.quantity })
          .eq("id", existing.id)
      } else {
        await supabase.from("cart_items").insert({
          cart_id: cartId,
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          price_at_time: item.price_at_time,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
