"use server"

import { requireAdminThrow } from "@/lib/supabase/admin"
import { sendOrderStatusEmail, sendOrderPaymentRejectedEmail, sendWorkshopRegistrationEmail } from "@/lib/email/integrations"

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

  sendOrderStatusEmail(orderId, "payment_verified").catch((err) =>
    console.error("[actions] Failed to send payment verified email:", err)
  )
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

  sendOrderPaymentRejectedEmail(orderId, reason).catch((err) =>
    console.error("[actions] Failed to send payment rejected email:", err)
  )
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

  sendOrderStatusEmail(orderId, status).catch((err) =>
    console.error("[actions] Failed to send order status email:", err)
  )
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

// ============================================================
// Workshop Registration Actions
// ============================================================

export async function updateRegistrationStatus(
  registrationId: string,
  status: string,
  options?: { cancellationReason?: string; adminNotes?: string }
) {
  const { supabase, user } = await requireAdminThrow()

  const updateData: Record<string, unknown> = { status }

  if (status === "cancelled") {
    updateData.cancelled_at = new Date().toISOString()
    if (options?.cancellationReason) updateData.cancellation_reason = options.cancellationReason
  }

  if (status === "confirmed") {
    updateData.payment_status = "verified"
  }

  if (status === "attended") {
    updateData.checked_in_at = new Date().toISOString()
  }

  if (options?.adminNotes !== undefined) {
    updateData.admin_notes = options.adminNotes
  }

  const { error } = await supabase
    .from("workshop_registrations")
    .update(updateData)
    .eq("id", registrationId)

  if (error) throw new Error("Failed to update registration status")

  // Fetch registration details for notification
  const { data: registration } = await supabase
    .from("workshop_registrations")
    .select("workshop_id, guest_name")
    .eq("id", registrationId)
    .single()

  if (registration) {
    const { data: workshop } = await supabase
      .from("workshops")
      .select("title")
      .eq("id", registration.workshop_id)
      .single()

    await supabase.from("admin_notifications").insert({
      type: `workshop_registration_${status}`,
      title: `Registration ${status}: ${registration.guest_name}`,
      message: `Workshop: ${workshop?.title || "Unknown"}`,
      metadata: { registration_id: registrationId, workshop_id: registration.workshop_id, created_by: user.id },
    })
  }

  const emailEvents: Record<string, string> = {
    confirmed: "seat_confirmed",
    cancelled: "cancelled",
    attended: "completed",
  }
  const emailEvent = emailEvents[status]
  if (emailEvent) {
    sendWorkshopRegistrationEmail(registrationId, emailEvent, {
      reason: options?.cancellationReason,
    }).catch((err) =>
      console.error("[actions] Failed to send workshop email:", err)
    )
  }
}

export async function approveWorkshopPayment(registrationId: string) {
  const { supabase, user } = await requireAdminThrow()

  const { data: payment, error: payErr } = await supabase
    .from("workshop_payments")
    .select("id, amount")
    .eq("registration_id", registrationId)
    .eq("status", "submitted")
    .single()

  if (payErr || !payment) throw new Error("No submitted payment found")

  const { error: updatePayErr } = await supabase
    .from("workshop_payments")
    .update({
      status: "verified",
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq("id", payment.id)

  if (updatePayErr) throw new Error("Failed to update payment")

  await supabase
    .from("workshop_registrations")
    .update({ status: "confirmed", payment_status: "verified" })
    .eq("id", registrationId)

  const { data: registration } = await supabase
    .from("workshop_registrations")
    .select("workshop_id, guest_name")
    .eq("id", registrationId)
    .single()

  if (registration) {
    const { data: workshop } = await supabase
      .from("workshops")
      .select("title")
      .eq("id", registration.workshop_id)
      .single()

    await supabase.from("admin_notifications").insert({
      type: "workshop_payment_approved",
      title: `Payment approved: ${registration.guest_name}`,
      message: `Rs. ${payment.amount} verified for ${workshop?.title || "workshop"}`,
      metadata: { registration_id: registrationId, payment_id: payment.id, workshop_id: registration.workshop_id },
    })
  }

  sendWorkshopRegistrationEmail(registrationId, "payment_approved").catch((err) =>
    console.error("[actions] Failed to send workshop payment approved email:", err)
  )
}

export async function rejectWorkshopPayment(registrationId: string, reason: string) {
  const { supabase, user } = await requireAdminThrow()

  const { data: payment, error: payErr } = await supabase
    .from("workshop_payments")
    .select("id, amount")
    .eq("registration_id", registrationId)
    .eq("status", "submitted")
    .single()

  if (payErr || !payment) throw new Error("No submitted payment found")

  const { error: updatePayErr } = await supabase
    .from("workshop_payments")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", payment.id)

  if (updatePayErr) throw new Error("Failed to update payment")

  await supabase
    .from("workshop_registrations")
    .update({ status: "awaiting_payment", payment_status: "rejected" })
    .eq("id", registrationId)

  const { data: registration } = await supabase
    .from("workshop_registrations")
    .select("workshop_id, guest_name")
    .eq("id", registrationId)
    .single()

  if (registration) {
    const { data: workshop } = await supabase
      .from("workshops")
      .select("title")
      .eq("id", registration.workshop_id)
      .single()

    await supabase.from("admin_notifications").insert({
      type: "workshop_payment_rejected",
      title: `Payment rejected: ${registration.guest_name}`,
      message: `Rs. ${payment.amount} rejected for ${workshop?.title || "workshop"}. Reason: ${reason}`,
      metadata: { registration_id: registrationId, payment_id: payment.id, workshop_id: registration.workshop_id },
    })
  }

  sendWorkshopRegistrationEmail(registrationId, "payment_rejected", { reason }).catch((err) =>
    console.error("[actions] Failed to send workshop payment rejected email:", err)
  )
}

export async function cancelRegistration(registrationId: string, reason?: string) {
  const { supabase, user } = await requireAdminThrow()

  const { error } = await supabase
    .from("workshop_registrations")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || null,
    })
    .eq("id", registrationId)

  if (error) throw new Error("Failed to cancel registration")

  const { data: registration } = await supabase
    .from("workshop_registrations")
    .select("workshop_id, guest_name")
    .eq("id", registrationId)
    .single()

  if (registration) {
    const { data: workshop } = await supabase
      .from("workshops")
      .select("title")
      .eq("id", registration.workshop_id)
      .single()

    await supabase.from("admin_notifications").insert({
      type: "workshop_registration_cancelled",
      title: `Registration cancelled: ${registration.guest_name}`,
      message: `Workshop: ${workshop?.title || "Unknown"}. Reason: ${reason || "Not specified"}`,
      metadata: { registration_id: registrationId, workshop_id: registration.workshop_id, created_by: user.id },
    })
  }

  sendWorkshopRegistrationEmail(registrationId, "cancelled", { reason }).catch((err) =>
    console.error("[actions] Failed to send cancellation email:", err)
  )
}

export async function exportWorkshopRegistrations(workshopId: string) {
  const { supabase } = await requireAdminThrow()

  const { data: registrations, error } = await supabase
    .from("workshop_registrations")
    .select(`
      id, guest_name, guest_email, guest_phone, status, payment_status,
      registered_at, checked_in_at, admin_notes, cancellation_reason,
      workshop:workshops(title, fee, format),
      payments:workshop_payments(amount, status, transaction_ref)
    `)
    .eq("workshop_id", workshopId)
    .order("registered_at", { ascending: false })

  if (error) throw new Error("Failed to fetch registrations")

  return registrations || []
}
