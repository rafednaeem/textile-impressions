"use server"

import { requireAdminThrow } from "@/lib/supabase/admin"

export async function verifyPayment(orderId: string) {
  const { supabase, user } = await requireAdminThrow()

  const { error } = await supabase
    .from("payments")
    .update({ status: "verified", verified_at: new Date().toISOString(), verified_by: user.id })
    .eq("order_id", orderId)

  if (error) throw new Error("Failed to verify payment")

  await supabase.from("orders").update({ status: "payment_verified" }).eq("id", orderId)
  await supabase.from("order_timeline").insert({
    order_id: orderId,
    status: "payment_verified",
    note: "Payment verified by admin",
    created_by: user.id,
  })
}

export async function rejectPayment(orderId: string, reason: string) {
  const { supabase, user } = await requireAdminThrow()

  const { error } = await supabase
    .from("payments")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("order_id", orderId)

  if (error) throw new Error("Failed to reject payment")

  await supabase.from("order_timeline").insert({
    order_id: orderId,
    status: "payment_pending",
    note: `Payment rejected: ${reason}`,
    created_by: user.id,
  })
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { supabase, user } = await requireAdminThrow()

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)

  if (error) throw new Error("Failed to update order status")

  await supabase.from("order_timeline").insert({
    order_id: orderId,
    status,
    note: `Status changed to ${status.replace("_", " ")}`,
    created_by: user.id,
  })
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  const { supabase } = await requireAdminThrow()
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId)
  if (error) throw new Error("Failed to toggle product status")
}

export async function duplicateProduct(productId: string) {
  const { supabase } = await requireAdminThrow()

  const { data: original } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single()

  if (!original) throw new Error("Product not found")

  const { data: product } = await supabase
    .from("products")
    .insert({
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      description: original.description,
      short_description: original.short_description,
      price: original.price,
      sale_price: original.sale_price,
      inventory_count: 0,
      is_active: false,
      is_featured: false,
      category_id: original.category_id,
      tags: original.tags,
      craft_type: original.craft_type || "Plain",
      fabric: original.fabric,
      care_instructions: original.care_instructions,
    })
    .select("id")
    .single()

  if (!product) throw new Error("Failed to create duplicate")
  return product.id
}

export async function deleteProduct(productId: string) {
  const { supabase } = await requireAdminThrow()
  const { error } = await supabase.from("products").delete().eq("id", productId)
  if (error) throw new Error("Failed to delete product")
}

export async function updateInventory(productId: string, count: number) {
  const { supabase } = await requireAdminThrow()
  const { error } = await supabase
    .from("products")
    .update({ inventory_count: count })
    .eq("id", productId)
  if (error) throw new Error("Failed to update inventory")
}

export async function bulkUpdateInventory(updates: { id: string; count: number }[]) {
  const { supabase } = await requireAdminThrow()
  for (const update of updates) {
    const { error } = await supabase
      .from("products")
      .update({ inventory_count: update.count })
      .eq("id", update.id)
    if (error) throw new Error(`Failed to update product ${update.id}`)
  }
}
