import type { BusinessSettings } from "../config"
import { baseLayout, sectionBox } from "./base-layout"

interface IncubatorData {
  name: string
  email: string
  phone: string
  craftType: string
  description?: string
}

export function incubatorEnquiryReceivedTemplate(
  enquiry: IncubatorData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const detailsHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr><td style="padding:4px 0;font-size:13px;color:#555;"><strong>Craft Type:</strong></td><td style="padding:4px 0;font-size:13px;color:#555;">${escapeHtml(enquiry.craftType)}</td></tr>
      ${enquiry.description ? `<tr><td style="padding:4px 0;font-size:13px;color:#555;"><strong>Description:</strong></td><td style="padding:4px 0;font-size:13px;color:#555;">${escapeHtml(enquiry.description)}</td></tr>` : ""}
    </table>
  `

  const content = `
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(enquiry.name)},</p>
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Your Incubator Inquiry Has Been Received</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Thank you for your interest in the ${business.store_name} Incubator Programme. We have received your inquiry and are excited to learn more about your craft.
    </p>
    ${sectionBox(detailsHtml)}
    <p style="margin:16px 0 0;color:#555;font-size:14px;line-height:1.6;">
      <strong>What happens next?</strong>
    </p>
    <ol style="margin:8px 0 0;padding-left:20px;color:#555;font-size:13px;line-height:1.8;">
      <li>Our team will review your application</li>
      <li>We will contact you within 3-5 business days</li>
      <li>If your craft aligns with our programme, we will schedule a meeting</li>
      <li>We will discuss potential collaboration opportunities</li>
    </ol>
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      We appreciate your interest in preserving and promoting traditional crafts. If you have any questions, please reply to this email.
    </p>
  `

  return {
    subject: "Your Incubator Inquiry Has Been Received",
    html: baseLayout(content, business, "Your incubator inquiry has been received."),
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
