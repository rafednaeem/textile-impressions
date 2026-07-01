import type { BusinessSettings } from "../config"
import { sectionBox, ctaButton, baseLayout } from "./base-layout"

interface OrderData {
  orderNumber: string
  customerName: string
  items: { name: string; quantity: number; price: number }[]
  subtotal: number
  shippingCost: number
  total: number
  status: string
  paymentMethod?: string
  shippingAddress?: Record<string, string>
  notes?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  payment_pending: "Awaiting Payment",
  payment_submitted: "Payment Proof Received",
  payment_verified: "Payment Approved",
  processing: "Being Prepared",
  shipped: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
  cod_pending: "Cash on Delivery Pending",
  dispatched: "Dispatched",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  payment_pending: "#f59e0b",
  payment_submitted: "#3b82f6",
  payment_verified: "#10b981",
  processing: "#8b5cf6",
  shipped: "#3b82f6",
  delivered: "#10b981",
  cancelled: "#ef4444",
  cod_pending: "#f59e0b",
  dispatched: "#3b82f6",
}

function orderSummaryHtml(order: OrderData): string {
  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;color:#555;">${escapeHtml(i.name)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;text-align:center;color:#555;">${i.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;text-align:right;color:#555;">Rs. ${i.price.toLocaleString()}</td>
        </tr>`,
    )
    .join("")

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <thead>
      <tr>
        <th style="padding:8px 0;text-align:left;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;border-bottom:2px solid #1a3a2a;">Item</th>
        <th style="padding:8px 0;text-align:center;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;border-bottom:2px solid #1a3a2a;">Qty</th>
        <th style="padding:8px 0;text-align:right;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;border-bottom:2px solid #1a3a2a;">Price</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding:8px 0;font-size:13px;text-align:right;color:#555;">Subtotal:</td>
        <td style="padding:8px 0;font-size:13px;text-align:right;color:#555;">Rs. ${order.subtotal.toLocaleString()}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:4px 0;font-size:13px;text-align:right;color:#555;">Shipping:</td>
        <td style="padding:4px 0;font-size:13px;text-align:right;color:#555;">${order.shippingCost === 0 ? "Free" : `Rs. ${order.shippingCost.toLocaleString()}`}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:8px 0;font-size:15px;font-weight:700;text-align:right;color:#1a3a2a;border-top:2px solid #1a3a2a;">Total:</td>
        <td style="padding:8px 0;font-size:15px;font-weight:700;text-align:right;color:#1a3a2a;border-top:2px solid #1a3a2a;">Rs. ${order.total.toLocaleString()}</td>
      </tr>
    </tfoot>
  </table>`
}

function greeting(name: string): string {
  return `<p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(name)},</p>`
}

function orderRef(orderNumber: string): string {
  return `<p style="margin:0 0 4px;color:#888;font-size:13px;">Order Reference: <strong style="color:#333;">#${escapeHtml(orderNumber)}</strong></p>`
}

export interface FullOrderData extends OrderData {
  paymentStatus?: string
  rejectionReason?: string | null
  transactionRef?: string | null
  meetingUrl?: string | null
  meetingPlatform?: string | null
}

export function orderReceivedTemplate(
  order: FullOrderData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    ${greeting(order.customerName)}
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Thank you for your order!</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      We have received your order and it is now being reviewed. We will notify you once the payment has been confirmed and your order begins processing.
    </p>
    ${orderRef(order.orderNumber)}
    ${sectionBox(orderSummaryHtml(order))}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      If you have any questions about your order, please reply to this email or contact our support team.
    </p>
  `

  return {
    subject: `Order Received - #${order.orderNumber}`,
    html: baseLayout(content, business, `Your order #${order.orderNumber} has been received.`),
  }
}

export function orderPaymentPendingTemplate(
  order: FullOrderData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const bankHtml = order.paymentMethod === "bank_transfer"
    ? sectionBox(`
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1a3a2a;">Bank Transfer Details</p>
      <p style="margin:0 0 2px;font-size:13px;color:#555;">Bank: ${escapeHtml(business.bank_name)}</p>
      <p style="margin:0 0 2px;font-size:13px;color:#555;">Account Title: ${escapeHtml(business.bank_account_title)}</p>
      <p style="margin:0 0 2px;font-size:13px;color:#555;">Account Number: ${escapeHtml(business.bank_account)}</p>
      <p style="margin:0;font-size:13px;color:#555;">IBAN: ${escapeHtml(business.bank_iban)}</p>
    `)
    : ""

  const content = `
    ${greeting(order.customerName)}
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Payment Required</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Thank you for your order <strong>#${order.orderNumber}</strong>. To proceed, please complete your payment using the bank transfer details below and upload your payment proof.
    </p>
    ${orderRef(order.orderNumber)}
    ${sectionBox(orderSummaryHtml(order))}
    ${bankHtml}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      Once we receive your payment proof, we will verify it and update your order status accordingly.
    </p>
    ${ctaButton(`${business.store_website}/account/orders`, "View Your Orders")}
  `

  return {
    subject: `Payment Required for Order #${order.orderNumber}`,
    html: baseLayout(content, business, `Payment is required for order #${order.orderNumber}.`),
  }
}

export function orderPaymentProofReceivedTemplate(
  order: FullOrderData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    ${greeting(order.customerName)}
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Payment Proof Received</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      We have received your payment proof for order <strong>#${order.orderNumber}</strong>. Our team will verify it shortly.
    </p>
    ${orderRef(order.orderNumber)}
    ${sectionBox(orderSummaryHtml(order))}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      We will notify you once the payment has been verified. This usually takes 24-48 hours.
    </p>
  `

  return {
    subject: `Payment Proof Received - Order #${order.orderNumber}`,
    html: baseLayout(content, business, `Payment proof received for order #${order.orderNumber}.`),
  }
}

export function orderPaymentUnderVerificationTemplate(
  order: FullOrderData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    ${greeting(order.customerName)}
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Payment Under Verification</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Your payment for order <strong>#${order.orderNumber}</strong> is currently under verification.
    </p>
    ${orderRef(order.orderNumber)}
    ${sectionBox(orderSummaryHtml(order))}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      We will notify you as soon as the verification is complete. Thank you for your patience.
    </p>
  `

  return {
    subject: `Payment Under Verification - Order #${order.orderNumber}`,
    html: baseLayout(content, business, `Payment under verification for order #${order.orderNumber}.`),
  }
}

export function orderPaymentApprovedTemplate(
  order: FullOrderData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    ${greeting(order.customerName)}
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Payment Verified Successfully!</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Great news! Your payment for order <strong>#${order.orderNumber}</strong> has been verified. We are now processing your order.
    </p>
    ${orderRef(order.orderNumber)}
    ${sectionBox(orderSummaryHtml(order))}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      We will notify you when your order is dispatched. Thank you for shopping with us!
    </p>
    ${ctaButton(`${business.store_website}/account/orders`, "Track Your Order")}
  `

  return {
    subject: `Payment Verified - Order #${order.orderNumber}`,
    html: baseLayout(content, business, `Payment verified for order #${order.orderNumber}.`),
  }
}

export function orderPaymentRejectedTemplate(
  order: FullOrderData,
  business: BusinessSettings,
  overrideReason?: string,
): { subject: string; html: string } {
  const reason = overrideReason || order.rejectionReason
  const content = `
    ${greeting(order.customerName)}
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Payment Not Verified</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      We were unable to verify your payment for order <strong>#${order.orderNumber}</strong>.
    </p>
    ${orderRef(order.orderNumber)}
    ${sectionBox(orderSummaryHtml(order))}
    ${reason ? `<div style="background:#fef2f2;border-radius:6px;padding:12px;margin:12px 0;">
      <p style="margin:0;font-size:13px;color:#991b1b;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
    </div>` : ""}
    <p style="margin:12px 0 0;color:#888;font-size:13px;line-height:1.5;">
      Please check the payment details and try again, or contact our support team for assistance.
    </p>
  `

  return {
    subject: `Payment Not Verified - Order #${order.orderNumber}`,
    html: baseLayout(content, business, `Payment not verified for order #${order.orderNumber}.`),
  }
}

export function orderConfirmedTemplate(
  order: FullOrderData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    ${greeting(order.customerName)}
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Order Confirmed!</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Your order <strong>#${order.orderNumber}</strong> has been confirmed. We are now preparing your items.
    </p>
    ${orderRef(order.orderNumber)}
    ${sectionBox(orderSummaryHtml(order))}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      We will keep you updated on the progress of your order.
    </p>
    ${ctaButton(`${business.store_website}/account/orders`, "Track Your Order")}
  `

  return {
    subject: `Order Confirmed - #${order.orderNumber}`,
    html: baseLayout(content, business, `Order #${order.orderNumber} confirmed.`),
  }
}

export function orderBeingPreparedTemplate(
  order: FullOrderData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    ${greeting(order.customerName)}
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Order Being Prepared</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Your order <strong>#${order.orderNumber}</strong> is now being prepared. Our artisans are carefully working on your items.
    </p>
    ${orderRef(order.orderNumber)}
    ${sectionBox(orderSummaryHtml(order))}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      We will notify you once your order has been dispatched.
    </p>
  `

  return {
    subject: `Order Being Prepared - #${order.orderNumber}`,
    html: baseLayout(content, business, `Order #${order.orderNumber} is being prepared.`),
  }
}

export function orderDispatchedTemplate(
  order: FullOrderData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    ${greeting(order.customerName)}
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Order Dispatched!</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Your order <strong>#${order.orderNumber}</strong> has been dispatched and is on its way to you!
    </p>
    ${orderRef(order.orderNumber)}
    ${sectionBox(orderSummaryHtml(order))}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      Thank you for choosing ${business.store_name}. We hope you love your purchase!
    </p>
    ${ctaButton(`${business.store_website}/account/orders`, "Track Your Order")}
  `

  return {
    subject: `Order Dispatched - #${order.orderNumber}`,
    html: baseLayout(content, business, `Order #${order.orderNumber} has been dispatched.`),
  }
}

export function orderDeliveredTemplate(
  order: FullOrderData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    ${greeting(order.customerName)}
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Order Delivered!</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Your order <strong>#${order.orderNumber}</strong> has been delivered. We hope you love your handcrafted pieces!
    </p>
    ${orderRef(order.orderNumber)}
    ${sectionBox(orderSummaryHtml(order))}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      Thank you for supporting ${business.store_name}. Your satisfaction means the world to us!
      <br><br>
      If you love your purchase, we would be grateful if you could share your experience.
    </p>
    ${ctaButton(`${business.store_website}/account/orders`, "Leave a Review")}
  `

  return {
    subject: `Order Delivered - #${order.orderNumber}`,
    html: baseLayout(content, business, `Order #${order.orderNumber} delivered.`),
  }
}

export function orderCodReceivedTemplate(
  order: FullOrderData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    ${greeting(order.customerName)}
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Cash on Delivery Order Confirmed</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Your Cash on Delivery order <strong>#${order.orderNumber}</strong> has been confirmed. Please have the payment ready when your order arrives.
    </p>
    ${orderRef(order.orderNumber)}
    ${sectionBox(orderSummaryHtml(order))}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      We will notify you once your order is dispatched. Thank you for shopping with us!
    </p>
  `

  return {
    subject: `COD Order Confirmed - #${order.orderNumber}`,
    html: baseLayout(content, business, `COD order #${order.orderNumber} confirmed.`),
  }
}

export function orderCancelledTemplate(
  order: FullOrderData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    ${greeting(order.customerName)}
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Order Cancelled</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Your order <strong>#${order.orderNumber}</strong> has been cancelled as requested.
    </p>
    ${orderRef(order.orderNumber)}
    ${sectionBox(orderSummaryHtml(order))}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      If you have any questions about this cancellation, please contact our support team. We hope to serve you again in the future.
    </p>
    ${ctaButton(`${business.store_website}`, "Continue Shopping")}
  `

  return {
    subject: `Order Cancelled - #${order.orderNumber}`,
    html: baseLayout(content, business, `Order #${order.orderNumber} cancelled.`),
  }
}

export function orderRefundProcessedTemplate(
  order: FullOrderData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    ${greeting(order.customerName)}
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Refund Processed</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      A refund for order <strong>#${order.orderNumber}</strong> has been processed. Please allow 5-7 business days for the amount to reflect in your account.
    </p>
    ${orderRef(order.orderNumber)}
    ${sectionBox(orderSummaryHtml(order))}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      If you have any questions, please contact our support team.
    </p>
  `

  return {
    subject: `Refund Processed - Order #${order.orderNumber}`,
    html: baseLayout(content, business, `Refund processed for order #${order.orderNumber}.`),
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function getOrderTemplate(
  status: string,
): ((order: FullOrderData, business: BusinessSettings) => { subject: string; html: string }) | null {
  const templates: Record<string, (order: FullOrderData, business: BusinessSettings) => { subject: string; html: string }> = {
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

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || "#6b7280"
}
