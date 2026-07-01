import type { BusinessSettings } from "../config"
import { baseLayout, sectionBox, ctaButton } from "./base-layout"

interface WorkshopData {
  title: string
  instructorName?: string
  format: string
  dateStart: string | null
  dateEnd: string | null
  locationAddress: string | null
  meetingUrl: string | null
  meetingPlatform: string | null
  meetingId: string | null
  fee: number
}

interface RegistrationData {
  guestName: string
  guestEmail: string
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBA"
  return new Date(dateStr).toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function workshopDetailsHtml(workshop: WorkshopData, registration: RegistrationData): string {
  let details = ""
  if (workshop.format === "in_person" && workshop.locationAddress) {
    details = `<p style="margin:4px 0;font-size:13px;color:#555;"><strong>Location:</strong> ${escapeHtml(workshop.locationAddress)}</p>`
  }

  return sectionBox(`
    <p style="margin:0 0 4px;font-size:13px;color:#555;"><strong>Workshop:</strong> ${escapeHtml(workshop.title)}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555;"><strong>Instructor:</strong> ${escapeHtml(workshop.instructorName || "Textile Impressions")}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555;"><strong>Date:</strong> ${formatDate(workshop.dateStart)}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555;"><strong>Format:</strong> ${workshop.format.replace("_", " ")}</p>
    ${details}
  `)
}

export function workshopRegistrationReceivedTemplate(
  registration: RegistrationData,
  workshop: WorkshopData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(registration.guestName)},</p>
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Registration Received!</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Thank you for registering for <strong>${escapeHtml(workshop.title)}</strong>. We have received your registration request.
    </p>
    ${workshopDetailsHtml(workshop, registration)}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      We will review your registration and send you a confirmation shortly. Please save this email for your records.
    </p>
  `

  return {
    subject: `Registration Received - ${workshop.title}`,
    html: baseLayout(content, business, `Registration received for ${workshop.title}.`),
  }
}

export function workshopRegistrationConfirmedFreeTemplate(
  registration: RegistrationData,
  workshop: WorkshopData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(registration.guestName)},</p>
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Registration Confirmed!</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Your registration for <strong>${escapeHtml(workshop.title)}</strong> has been confirmed. We look forward to having you!
    </p>
    ${workshopDetailsHtml(workshop, registration)}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      Please save this email for your records. We will send you a reminder before the workshop.
    </p>
  `

  return {
    subject: `Registration Confirmed - ${workshop.title}`,
    html: baseLayout(content, business, `Registration confirmed for ${workshop.title}.`),
  }
}

export function workshopPaymentRequiredTemplate(
  registration: RegistrationData,
  workshop: WorkshopData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const bankHtml = sectionBox(`
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1a3a2a;">Bank Transfer Details</p>
    <p style="margin:0 0 2px;font-size:13px;color:#555;">Bank: ${escapeHtml(business.bank_name)}</p>
    <p style="margin:0 0 2px;font-size:13px;color:#555;">Account Title: ${escapeHtml(business.bank_account_title)}</p>
    <p style="margin:0 0 2px;font-size:13px;color:#555;">Account Number: ${escapeHtml(business.bank_account)}</p>
    <p style="margin:0;font-size:13px;color:#555;">IBAN: ${escapeHtml(business.bank_iban)}</p>
  `)

  const content = `
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(registration.guestName)},</p>
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Payment Required to Confirm Your Spot</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Thank you for registering for <strong>${escapeHtml(workshop.title)}</strong>. To confirm your spot, please complete the payment of <strong>Rs. ${workshop.fee.toLocaleString()}</strong>.
    </p>
    ${workshopDetailsHtml(workshop, registration)}
    ${bankHtml}
    <p style="margin:12px 0;color:#888;font-size:13px;line-height:1.5;">
      After transferring, please upload your payment proof on the registration page. Your spot will be confirmed once we verify the payment.
    </p>
  `

  return {
    subject: `Payment Required - ${workshop.title}`,
    html: baseLayout(content, business, `Payment required to confirm your spot in ${workshop.title}.`),
  }
}

export function workshopPaymentProofReceivedTemplate(
  registration: RegistrationData,
  workshop: WorkshopData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(registration.guestName)},</p>
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Payment Proof Received</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      We have received your payment proof for <strong>${escapeHtml(workshop.title)}</strong>. Our team will review it shortly.
    </p>
    ${workshopDetailsHtml(workshop, registration)}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      We will notify you once the payment has been verified. This usually takes 24-48 hours.
    </p>
  `

  return {
    subject: `Payment Proof Received - ${workshop.title}`,
    html: baseLayout(content, business, `Payment proof received for ${workshop.title}.`),
  }
}

export function workshopPaymentUnderReviewTemplate(
  registration: RegistrationData,
  workshop: WorkshopData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(registration.guestName)},</p>
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Payment Under Review</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Your payment for <strong>${escapeHtml(workshop.title)}</strong> is currently under review.
    </p>
    ${workshopDetailsHtml(workshop, registration)}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      We will notify you as soon as the verification is complete.
    </p>
  `

  return {
    subject: `Payment Under Review - ${workshop.title}`,
    html: baseLayout(content, business, `Payment under review for ${workshop.title}.`),
  }
}

export function workshopPaymentApprovedTemplate(
  registration: RegistrationData,
  workshop: WorkshopData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const isOnline = workshop.format === "online" || workshop.format === "hybrid"

  let accessHtml = ""
  if (isOnline && workshop.meetingUrl) {
    accessHtml = sectionBox(`
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1a3a2a;">Workshop Access Details</p>
      <p style="margin:0 0 4px;font-size:13px;color:#555;"><strong>Platform:</strong> ${workshop.meetingPlatform ? escapeHtml(workshop.meetingPlatform) : "Video Call"}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#555;"><strong>Meeting Link:</strong> <a href="${escapeHtml(workshop.meetingUrl)}" style="color:#c65d47;">${escapeHtml(workshop.meetingUrl)}</a></p>
      ${workshop.meetingId ? `<p style="margin:0 0 4px;font-size:13px;color:#555;"><strong>Meeting ID:</strong> ${escapeHtml(workshop.meetingId)}</p>` : ""}
      <p style="margin:8px 0 0;font-size:12px;color:#888;">Please keep these details confidential. The meeting link will also be available in your account.</p>
    `)
  }

  const content = `
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(registration.guestName)},</p>
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Payment Verified - Seat Confirmed!</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Your payment for <strong>${escapeHtml(workshop.title)}</strong> has been verified. Your spot is now confirmed!
    </p>
    ${workshopDetailsHtml(workshop, registration)}
    ${accessHtml}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      We look forward to seeing you at the workshop! Please save this email for your records.
    </p>
  `

  return {
    subject: `Payment Verified - Confirmed for ${workshop.title}`,
    html: baseLayout(content, business, `Payment verified! You're confirmed for ${workshop.title}.`),
  }
}

export function workshopPaymentRejectedTemplate(
  registration: RegistrationData,
  workshop: WorkshopData,
  business: BusinessSettings,
  reason: string,
): { subject: string; html: string } {
  const content = `
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(registration.guestName)},</p>
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Payment Not Verified</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      We were unable to verify your payment for <strong>${escapeHtml(workshop.title)}</strong>.
    </p>
    <div style="background:#fef2f2;border-radius:6px;padding:12px;margin:12px 0;">
      <p style="margin:0;font-size:13px;color:#991b1b;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
    </div>
    ${workshopDetailsHtml(workshop, registration)}
    <p style="margin:12px 0 0;color:#888;font-size:13px;line-height:1.5;">
      Please check the payment details and upload a new payment proof, or contact us if you believe this is an error.
    </p>
  `

  return {
    subject: `Payment Not Verified - ${workshop.title}`,
    html: baseLayout(content, business, `Payment not verified for ${workshop.title}.`),
  }
}

export function workshopSeatConfirmedTemplate(
  registration: RegistrationData,
  workshop: WorkshopData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const isOnline = workshop.format === "online" || workshop.format === "hybrid"

  let accessHtml = ""
  if (isOnline && workshop.meetingUrl) {
    accessHtml = sectionBox(`
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1a3a2a;">Workshop Access Details</p>
      <p style="margin:0 0 4px;font-size:13px;color:#555;"><strong>Platform:</strong> ${workshop.meetingPlatform ? escapeHtml(workshop.meetingPlatform) : "Video Call"}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#555;"><strong>Meeting Link:</strong> <a href="${escapeHtml(workshop.meetingUrl)}" style="color:#c65d47;">${escapeHtml(workshop.meetingUrl)}</a></p>
      ${workshop.meetingId ? `<p style="margin:0 0 4px;font-size:13px;color:#555;"><strong>Meeting ID:</strong> ${escapeHtml(workshop.meetingId)}</p>` : ""}
      <p style="margin:8px 0 0;font-size:12px;color:#888;">Please keep these details confidential.</p>
    `)
  }

  const content = `
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(registration.guestName)},</p>
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Seat Confirmed!</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Your spot for <strong>${escapeHtml(workshop.title)}</strong> is confirmed. We look forward to having you!
    </p>
    ${workshopDetailsHtml(workshop, registration)}
    ${accessHtml}
  `

  return {
    subject: `Seat Confirmed - ${workshop.title}`,
    html: baseLayout(content, business, `Seat confirmed for ${workshop.title}.`),
  }
}

export function workshopReminderTemplate(
  registration: RegistrationData,
  workshop: WorkshopData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const isOnline = workshop.format === "online" || workshop.format === "hybrid"

  let accessHtml = ""
  if (isOnline && workshop.meetingUrl) {
    accessHtml = sectionBox(`
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1a3a2a;">Workshop Access</p>
      <p style="margin:0 0 4px;font-size:13px;color:#555;"><strong>Platform:</strong> ${workshop.meetingPlatform ? escapeHtml(workshop.meetingPlatform) : "Video Call"}</p>
      <p style="margin:0;font-size:13px;color:#555;"><strong>Link:</strong> <a href="${escapeHtml(workshop.meetingUrl)}" style="color:#c65d47;">${escapeHtml(workshop.meetingUrl)}</a></p>
    `)
  } else if (workshop.format === "in_person" && workshop.locationAddress) {
    accessHtml = sectionBox(`
      <p style="margin:0;font-size:13px;color:#555;"><strong>Location:</strong> ${escapeHtml(workshop.locationAddress)}</p>
    `)
  }

  const content = `
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(registration.guestName)},</p>
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Workshop Reminder</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      This is a friendly reminder that <strong>${escapeHtml(workshop.title)}</strong> is happening on <strong>${formatDate(workshop.dateStart)}</strong>!
    </p>
    ${workshopDetailsHtml(workshop, registration)}
    ${accessHtml}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      We can't wait to see you there! Please arrive on time.
    </p>
  `

  return {
    subject: `Reminder: ${workshop.title} is Coming Up!`,
    html: baseLayout(content, business, `Reminder: ${workshop.title} is tomorrow!`),
  }
}

export function workshopCompletedTemplate(
  registration: RegistrationData,
  workshop: WorkshopData,
  business: BusinessSettings,
): { subject: string; html: string } {
  const content = `
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(registration.guestName)},</p>
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Workshop Completed!</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Thank you for attending <strong>${escapeHtml(workshop.title)}</strong>! We hope you had a wonderful experience and learned something new.
    </p>
    ${workshopDetailsHtml(workshop, registration)}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      Stay tuned for more workshops and events from ${business.store_name}. We would love to hear your feedback!
    </p>
    ${ctaButton(`${business.store_website}/contact`, "Share Your Feedback")}
  `

  return {
    subject: `Workshop Completed - ${workshop.title}`,
    html: baseLayout(content, business, `Workshop completed: ${workshop.title}.`),
  }
}

export function workshopCancelledTemplate(
  registration: RegistrationData,
  workshop: WorkshopData,
  business: BusinessSettings,
  reason?: string,
): { subject: string; html: string } {
  const content = `
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">Dear ${escapeHtml(registration.guestName)},</p>
    <p style="margin:0 0 4px;color:#333;font-size:16px;font-weight:600;">Workshop Cancelled</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      We regret to inform you that <strong>${escapeHtml(workshop.title)}</strong> has been cancelled.
    </p>
    ${reason ? `<div style="background:#fef2f2;border-radius:6px;padding:12px;margin:12px 0;">
      <p style="margin:0;font-size:13px;color:#991b1b;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
    </div>` : ""}
    ${workshopDetailsHtml(workshop, registration)}
    <p style="margin:16px 0 0;color:#888;font-size:13px;line-height:1.5;">
      We apologise for any inconvenience caused. If you have made a payment, we will process a full refund within 5-7 business days. Please contact us if you have any questions.
    </p>
    ${ctaButton(`${business.store_website}/skills-studio`, "Browse Other Workshops")}
  `

  return {
    subject: `Workshop Cancelled - ${workshop.title}`,
    html: baseLayout(content, business, `Workshop cancelled: ${workshop.title}.`),
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
