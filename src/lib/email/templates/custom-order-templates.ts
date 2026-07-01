import type { BusinessSettings } from "../config"
import { baseLayout, sectionBox } from "./base-layout"

interface CustomOrderData {
  name: string
  email: string
  phone: string
  garmentType: string
  fabricPreference?: string
  colorPreference?: string
  size?: string
  quantity: number
  budgetRange?: string
  deadline?: string
  notes?: string
}

export function customOrderReceivedTemplate(
  order: CustomOrderData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const detailsHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr><td style="padding:4px 0;font-size:13px;color:#555;"><strong>Garment Type:</strong></td><td style="padding:4px 0;font-size:13px;color:#555;">${escapeHtml(order.garmentType)}</td></tr>
      ${order.fabricPreference ? `<tr><td style="padding:4px 0;font-size:13px;color:#555;"><strong>Fabric:</strong></td><td style="padding:4px 0;font-size:13px;color:#555;">${escapeHtml(order.fabricPreference)}</td></tr>` : ""}
      ${order.colorPreference ? `<tr><td style="padding:4px 0;font-size:13px;color:#555;"><strong>Color:</strong></td><td style="padding:4px 0;font-size:13px;color:#555;">${escapeHtml(order.colorPreference)}</td></tr>` : ""}
      ${order.size ? `<tr><td style="padding:4px 0;font-size:13px;color:#555;"><strong>Size:</strong></td><td style="padding:4px 0;font-size:13px;color:#555;">${escapeHtml(order.size)}</td></tr>` : ""}
      <tr><td style="padding:4px 0;font-size:13px;color:#555;"><strong>Quantity:</strong></td><td style="padding:4px 0;font-size:13px;color:#555;">${order.quantity}</td></tr>
      ${order.budgetRange ? `<tr><td style="padding:4px 0;font-size:13px;color:#555;"><strong>Budget:</strong></td><td style="padding:4px 0;font-size:13px;color:#555;">${escapeHtml(order.budgetRange)}</td></tr>` : ""}
      ${order.deadline ? `<tr><td style="padding:4px 0;font-size:13px;color:#555;"><strong>Deadline:</strong></td><td style="padding:4px 0;font-size:13px;color:#555;">${escapeHtml(order.deadline)}</td></tr>` : ""}
    </table>
  `

  const content = `
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(order.name)},</p>
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Your Custom Order Request Has Been Received</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Thank you for your interest in a custom-made piece from ${business.store_name}. We have received your request and our team will review it shortly.
    </p>
    ${sectionBox(detailsHtml)}
    <p style="margin:16px 0 0;color:#555;font-size:14px;line-height:1.6;">
      <strong>What happens next?</strong>
    </p>
    <ol style="margin:8px 0 0;padding-left:20px;color:#555;font-size:13px;line-height:1.8;">
      <li>Our team will review your requirements</li>
      <li>We will contact you within 24-48 hours to discuss your order</li>
      <li>We may reach out if we need additional information</li>
      <li>Once finalised, we will provide a quote and timeline</li>
    </ol>
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      If you have any questions in the meantime, please reply to this email or contact us via WhatsApp.
    </p>
  `

  return {
    subject: "Your Custom Order Request Has Been Received",
    html: baseLayout(content, business, "Your custom order request has been received."),
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
