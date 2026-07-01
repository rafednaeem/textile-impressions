import { getServiceRoleClient } from "@/lib/supabase/service-role"
import { getBusinessSettings } from "./config"
import { sendEmailWithRetry, checkDuplicateEmail, type SendEmailParams } from "./service"
import {
  orderReceivedTemplate,
  orderPaymentPendingTemplate,
  orderPaymentProofReceivedTemplate,
  orderPaymentUnderVerificationTemplate,
  orderPaymentApprovedTemplate,
  orderPaymentRejectedTemplate,
  orderConfirmedTemplate,
  orderBeingPreparedTemplate,
  orderDispatchedTemplate,
  orderDeliveredTemplate,
  orderCodReceivedTemplate,
  orderCancelledTemplate,
  orderRefundProcessedTemplate,
  workshopRegistrationReceivedTemplate,
  workshopRegistrationConfirmedFreeTemplate,
  workshopPaymentRequiredTemplate,
  workshopPaymentProofReceivedTemplate,
  workshopPaymentUnderReviewTemplate,
  workshopPaymentApprovedTemplate,
  workshopPaymentRejectedTemplate,
  workshopSeatConfirmedTemplate,
  workshopReminderTemplate,
  workshopCompletedTemplate,
  workshopCancelledTemplate,
  customOrderReceivedTemplate,
  incubatorEnquiryReceivedTemplate,
  type FullOrderData,
} from "./templates"

// ============================================================
// Order emails
// ============================================================

export async function sendOrderStatusEmail(
  orderId: string,
  newStatus: string,
  rejectionReason?: string | null,
): Promise<void> {
  try {
    const serviceRole = getServiceRoleClient()
    const business = await getBusinessSettings()

    const { data: order } = await serviceRole
      .from("orders")
      .select(`
        id, order_number, user_id, status, shipping_address, subtotal, shipping_cost, total, notes,
        profiles!orders_user_id_fkey(email, full_name),
        order_items(id, product_name, quantity, unit_price),
        payments(method, status, transaction_reference, rejection_reason, proof_url)
      `)
      .eq("id", orderId)
      .single()

    if (!order) {
      console.error(`[email] Order ${orderId} not found`)
      return
    }

    const shippingAddr = order.shipping_address as Record<string, string> | undefined
    const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles as { email?: string; full_name?: string } | undefined
    const recipientEmail = profile?.email || shippingAddr?.guest_email
    if (!recipientEmail) {
      console.error(`[email] No email for order ${orderId}`)
      return
    }

    const dedupKey = `order:${orderId}:${newStatus}`
    const isDuplicate = await checkDuplicateEmail(dedupKey)
    if (isDuplicate) return

    const items = (order.order_items || []).map((item: any) => ({
      name: item.product_name,
      quantity: item.quantity,
      price: Number(item.unit_price),
    }))

    const payment = order.payments?.[0]
    const orderData: FullOrderData = {
      orderNumber: order.order_number,
      customerName: profile?.full_name || shippingAddr?.full_name || "Valued Customer",
      items,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shipping_cost),
      total: Number(order.total),
      status: newStatus,
      paymentMethod: payment?.method,
      notes: order.notes,
      paymentStatus: payment?.status,
      rejectionReason: rejectionReason || payment?.rejection_reason,
      transactionRef: payment?.transaction_reference,
    }

    const templateFn = getTemplateForOrderStatus(newStatus)
    if (!templateFn) {
      console.log(`[email] No template for order status: ${newStatus}`)
      return
    }

    const { subject, html } = templateFn(orderData, business)
    await sendEmailWithRetry({
      to: recipientEmail,
      subject,
      html,
      template: `order_${newStatus}`,
      dedupKey,
      metadata: { order_id: orderId, status: newStatus },
    })
  } catch (err) {
    console.error(`[email] sendOrderStatusEmail error:`, err)
  }
}

function getTemplateForOrderStatus(status: string) {
  const templates: Record<string, typeof orderReceivedTemplate> = {
    pending: orderReceivedTemplate,
    payment_pending: orderPaymentPendingTemplate,
    payment_submitted: orderPaymentProofReceivedTemplate,
    payment_verified: orderPaymentApprovedTemplate,
    processing: orderBeingPreparedTemplate,
    shipped: orderDispatchedTemplate,
    delivered: orderDeliveredTemplate,
    cancelled: orderCancelledTemplate,
    cod_pending: orderCodReceivedTemplate,
    dispatched: orderDispatchedTemplate,
  }
  return templates[status] || null
}

export async function sendOrderPaymentRejectedEmail(
  orderId: string,
  reason: string,
): Promise<void> {
  await sendOrderStatusEmail(orderId, "payment_verified", reason)
  // Actually use the rejected template via a custom call
  try {
    const serviceRole = getServiceRoleClient()
    const business = await getBusinessSettings()

    const { data: order } = await serviceRole
      .from("orders")
      .select(`
        id, order_number, user_id, shipping_address, subtotal, shipping_cost, total,
        profiles!orders_user_id_fkey(email, full_name),
        order_items(id, product_name, quantity, unit_price),
        payments(method, transaction_reference, rejection_reason)
      `)
      .eq("id", orderId)
      .single()

    if (!order) return

    const shippingAddr = order.shipping_address as Record<string, string> | undefined
    const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles as { email?: string; full_name?: string } | undefined
    const recipientEmail = profile?.email || shippingAddr?.guest_email
    if (!recipientEmail) return

    const dedupKey = `order:${orderId}:payment_rejected`
    if (await checkDuplicateEmail(dedupKey)) return

    const items = (order.order_items || []).map((item: any) => ({
      name: item.product_name,
      quantity: item.quantity,
      price: Number(item.unit_price),
    }))

    const payment = order.payments?.[0]
    const orderData: FullOrderData = {
      orderNumber: order.order_number,
      customerName: profile?.full_name || shippingAddr?.full_name || "Valued Customer",
      items,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shipping_cost),
      total: Number(order.total) || items.reduce((s, i) => s + i.price * i.quantity, 0),
      status: "payment_pending",
      paymentMethod: payment?.method,
      rejectionReason: reason || payment?.rejection_reason,
      transactionRef: payment?.transaction_reference,
    }

    const { subject, html } = orderPaymentRejectedTemplate(orderData, business, reason)
    await sendEmailWithRetry({
      to: recipientEmail,
      subject,
      html,
      template: "order_payment_rejected",
      dedupKey,
      metadata: { order_id: orderId, rejection_reason: reason },
    })
  } catch (err) {
    console.error(`[email] sendOrderPaymentRejectedEmail error:`, err)
  }
}

// ============================================================
// Workshop registration emails
// ============================================================

export async function sendWorkshopRegistrationEmail(
  registrationId: string,
  event: string,
  extra?: { reason?: string },
): Promise<void> {
  try {
    const serviceRole = getServiceRoleClient()
    const business = await getBusinessSettings()

    const { data: registration } = await serviceRole
      .from("workshop_registrations")
      .select("*")
      .eq("id", registrationId)
      .single()

    if (!registration) {
      console.error(`[email] Registration ${registrationId} not found`)
      return
    }

    const { data: workshop } = await serviceRole
      .from("workshops")
      .select("id, title, instructor_name, format, date_start, date_end, location_address, online_meeting_url, online_meeting_platform, online_meeting_id, fee")
      .eq("id", registration.workshop_id)
      .single()

    if (!workshop) {
      console.error(`[email] Workshop ${registration.workshop_id} not found`)
      return
    }

    const dedupKey = `workshop:${registrationId}:${event}`
    if (await checkDuplicateEmail(dedupKey)) return

    const registrationData = {
      guestName: registration.guest_name || "Participant",
      guestEmail: registration.guest_email || "",
    }

    const workshopData = {
      title: workshop.title,
      instructorName: workshop.instructor_name,
      format: workshop.format,
      dateStart: workshop.date_start,
      dateEnd: workshop.date_end,
      locationAddress: workshop.location_address,
      meetingUrl: workshop.online_meeting_url,
      meetingPlatform: workshop.online_meeting_platform,
      meetingId: workshop.online_meeting_id,
      fee: Number(workshop.fee),
    }

    let result: { subject: string; html: string } | null = null

    switch (event) {
      case "registered":
        if (workshop.fee > 0) {
          result = workshopPaymentRequiredTemplate(registrationData, workshopData, business)
        } else {
          result = workshopRegistrationConfirmedFreeTemplate(registrationData, workshopData, business)
        }
        break
      case "confirmed":
        result = workshopRegistrationConfirmedFreeTemplate(registrationData, workshopData, business)
        break
      case "payment_required":
        result = workshopPaymentRequiredTemplate(registrationData, workshopData, business)
        break
      case "payment_submitted":
        result = workshopPaymentProofReceivedTemplate(registrationData, workshopData, business)
        break
      case "payment_under_review":
        result = workshopPaymentUnderReviewTemplate(registrationData, workshopData, business)
        break
      case "payment_approved": {
        result = workshopPaymentApprovedTemplate(registrationData, workshopData, business)
        break
      }
      case "payment_rejected":
        result = workshopPaymentRejectedTemplate(registrationData, workshopData, business, extra?.reason || "Payment could not be verified")
        break
      case "seat_confirmed":
        result = workshopSeatConfirmedTemplate(registrationData, workshopData, business)
        break
      case "reminder":
        result = workshopReminderTemplate(registrationData, workshopData, business)
        break
      case "completed":
        result = workshopCompletedTemplate(registrationData, workshopData, business)
        break
      case "cancelled":
        result = workshopCancelledTemplate(registrationData, workshopData, business, extra?.reason)
        break
    }

    if (!result) {
      console.log(`[email] No template for workshop event: ${event}`)
      return
    }

    const recipientEmail = registration.guest_email
    if (!recipientEmail) {
      console.error(`[email] No email for registration ${registrationId}`)
      return
    }

    await sendEmailWithRetry({
      to: recipientEmail,
      subject: result.subject,
      html: result.html,
      template: `workshop_${event}`,
      dedupKey,
      metadata: { registration_id: registrationId, workshop_id: workshop.id, event },
    })
  } catch (err) {
    console.error(`[email] sendWorkshopRegistrationEmail error:`, err)
  }
}

// ============================================================
// Custom order email
// ============================================================

export async function sendCustomOrderConfirmationEmail(
  customOrderId: string,
): Promise<void> {
  try {
    const serviceRole = getServiceRoleClient()
    const business = await getBusinessSettings()

    const { data: order } = await serviceRole
      .from("custom_orders")
      .select("*")
      .eq("id", customOrderId)
      .single()

    if (!order) {
      console.error(`[email] Custom order ${customOrderId} not found`)
      return
    }

    if (!order.email) {
      console.error(`[email] No email for custom order ${customOrderId}`)
      return
    }

    const dedupKey = `custom_order:${customOrderId}`
    if (await checkDuplicateEmail(dedupKey)) return

    const { subject, html } = customOrderReceivedTemplate({
      name: order.name,
      email: order.email,
      phone: order.phone,
      garmentType: order.garment_type,
      fabricPreference: order.fabric_preference,
      colorPreference: order.color_preference,
      size: order.size,
      quantity: order.quantity,
      budgetRange: order.budget_range,
      deadline: order.deadline,
      notes: order.notes,
    }, business)

    await sendEmailWithRetry({
      to: order.email,
      subject,
      html,
      template: "custom_order_received",
      dedupKey,
      metadata: { custom_order_id: customOrderId },
    })
  } catch (err) {
    console.error(`[email] sendCustomOrderConfirmationEmail error:`, err)
  }
}

// ============================================================
// Incubator enquiry email
// ============================================================

export async function sendIncubatorEnquiryConfirmationEmail(
  enquiryId: string,
): Promise<void> {
  try {
    const serviceRole = getServiceRoleClient()
    const business = await getBusinessSettings()

    const { data: enquiry } = await serviceRole
      .from("incubator_enquiries")
      .select("*")
      .eq("id", enquiryId)
      .single()

    if (!enquiry) {
      console.error(`[email] Enquiry ${enquiryId} not found`)
      return
    }

    if (!enquiry.email) {
      console.error(`[email] No email for enquiry ${enquiryId}`)
      return
    }

    const dedupKey = `incubator_enquiry:${enquiryId}`
    if (await checkDuplicateEmail(dedupKey)) return

    const { subject, html } = incubatorEnquiryReceivedTemplate({
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      craftType: enquiry.craft_type,
      description: enquiry.description,
    }, business)

    await sendEmailWithRetry({
      to: enquiry.email,
      subject,
      html,
      template: "incubator_enquiry_received",
      dedupKey,
      metadata: { enquiry_id: enquiryId },
    })
  } catch (err) {
    console.error(`[email] sendIncubatorEnquiryConfirmationEmail error:`, err)
  }
}
