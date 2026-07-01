import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = "Textile Impressions <onboarding@resend.dev>"

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set. Email not sent:", subject)
    return { success: false, error: "Email not configured" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error("Email send error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    console.error("Email error:", err)
    return { success: false, error: "Failed to send email" }
  }
}

export function orderConfirmationHtml(orderNumber: string, items: { name: string; quantity: number; price: number }[], total: number) {
  const itemRows = items
    .map((i) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">Rs. ${i.price.toLocaleString()}</td></tr>`)
    .join("")

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#1a3a2a">Order Confirmed!</h2>
      <p>Thank you for your order <strong>#${orderNumber}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Price</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="font-size:18px;font-weight:bold;color:#1a3a2a">Total: Rs. ${total.toLocaleString()}</p>
      <p style="color:#666">We will notify you when your order ships.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
      <p style="font-size:12px;color:#999">Textile Impressions - Handcrafted Pakistani Fashion</p>
    </div>
  `
}

export function paymentVerifiedHtml(orderNumber: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#1a3a2a">Payment Verified</h2>
      <p>Your payment for order <strong>#${orderNumber}</strong> has been verified.</p>
      <p>We are now processing your order and will notify you when it ships.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
      <p style="font-size:12px;color:#999">Textile Impressions - Handcrafted Pakistani Fashion</p>
    </div>
  `
}

// ============================================================
// Workshop Email Templates
// ============================================================

export function workshopRegistrationConfirmedHtml(
  workshopTitle: string,
  dateStart: string | null,
  format: string,
  locationAddress: string | null,
  meetingUrl: string | null,
  meetingPlatform: string | null
) {
  const dateStr = dateStart ? new Date(dateStart).toLocaleDateString("en-PK", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  }) : "TBA"

  let locationHtml = ""
  if (format === "in_person" && locationAddress) {
    locationHtml = `<p style="margin:8px 0"><strong>Location:</strong> ${locationAddress}</p>`
  } else if (format === "online" && meetingUrl) {
    locationHtml = `
      <p style="margin:8px 0"><strong>Format:</strong> Online (${meetingPlatform || "Video Call"})</p>
      <p style="margin:8px 0"><strong>Meeting Link:</strong> <a href="${meetingUrl}" style="color:#1a3a2a">${meetingUrl}</a></p>
    `
  } else if (format === "hybrid") {
    locationHtml = `<p style="margin:8px 0"><strong>Format:</strong> Hybrid</p>`
    if (locationAddress) locationHtml += `<p style="margin:8px 0"><strong>In-Person Location:</strong> ${locationAddress}</p>`
    if (meetingUrl) locationHtml += `<p style="margin:8px 0"><strong>Online Link:</strong> <a href="${meetingUrl}" style="color:#1a3a2a">${meetingUrl}</a></p>`
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#1a3a2a">Workshop Registration Confirmed!</h2>
      <p>Your registration for <strong>${workshopTitle}</strong> has been confirmed.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Workshop:</strong> ${workshopTitle}</p>
        <p style="margin:4px 0"><strong>Date:</strong> ${dateStr}</p>
        ${locationHtml}
      </div>
      <p style="color:#666">Please save this email for your records. We will send you a reminder before the workshop.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
      <p style="font-size:12px;color:#999">Textile Impressions - Skills Studio</p>
    </div>
  `
}

export function workshopPaymentRequiredHtml(
  workshopTitle: string,
  amount: number,
  bankName: string,
  accountName: string,
  accountNumber: string,
  iban: string,
  registrationId: string
) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#1a3a2a">Payment Required</h2>
      <p>Thank you for registering for <strong>${workshopTitle}</strong>.</p>
      <p>To confirm your spot, please complete the payment of <strong>Rs. ${amount.toLocaleString()}</strong> and upload your payment proof.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0;font-weight:bold;color:#1a3a2a">Bank Transfer Details</p>
        <p style="margin:4px 0">Bank: ${bankName}</p>
        <p style="margin:4px 0">Account Name: ${accountName}</p>
        <p style="margin:4px 0">Account #: ${accountNumber}</p>
        <p style="margin:4px 0">IBAN: ${iban}</p>
        <p style="margin:4px 0"><strong>Amount: Rs. ${amount.toLocaleString()}</strong></p>
      </div>
      <p style="color:#666">After transferring, please upload your payment proof on the registration page. Your spot will be confirmed once we verify the payment.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
      <p style="font-size:12px;color:#999">Textile Impressions - Skills Studio</p>
    </div>
  `
}

export function workshopPaymentVerifiedHtml(workshopTitle: string, dateStart: string | null, format: string, meetingUrl: string | null) {
  const dateStr = dateStart ? new Date(dateStart).toLocaleDateString("en-PK", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  }) : "TBA"

  const meetingHtml = meetingUrl && format !== "in_person"
    ? `<p style="margin:8px 0"><strong>Meeting Link:</strong> <a href="${meetingUrl}" style="color:#1a3a2a">${meetingUrl}</a></p>`
    : ""

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#1a3a2a">Payment Verified - Registration Confirmed!</h2>
      <p>Your payment has been verified and your registration for <strong>${workshopTitle}</strong> is now confirmed.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Workshop:</strong> ${workshopTitle}</p>
        <p style="margin:4px 0"><strong>Date:</strong> ${dateStr}</p>
        ${meetingHtml}
      </div>
      <p style="color:#666">We look forward to seeing you at the workshop!</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
      <p style="font-size:12px;color:#999">Textile Impressions - Skills Studio</p>
    </div>
  `
}

export function workshopPaymentRejectedHtml(workshopTitle: string, reason: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#1a3a2a">Payment Not Verified</h2>
      <p>We were unable to verify your payment for <strong>${workshopTitle}</strong>.</p>
      <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0;color:#991b1b"><strong>Reason:</strong> ${reason}</p>
      </div>
      <p style="color:#666">Please check the details and re-upload your payment proof, or contact us if you believe this is an error.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
      <p style="font-size:12px;color:#999">Textile Impressions - Skills Studio</p>
    </div>
  `
}

export function workshopReminderHtml(workshopTitle: string, dateStart: string | null, format: string, locationAddress: string | null, meetingUrl: string | null) {
  const dateStr = dateStart ? new Date(dateStart).toLocaleDateString("en-PK", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  }) : "TBA"

  let joinHtml = ""
  if (format === "in_person" && locationAddress) {
    joinHtml = `<p style="margin:8px 0"><strong>Location:</strong> ${locationAddress}</p>`
  } else if (format === "online" && meetingUrl) {
    joinHtml = `<p style="margin:8px 0"><strong>Join Online:</strong> <a href="${meetingUrl}" style="color:#1a3a2a">${meetingUrl}</a></p>`
  } else if (format === "hybrid") {
    if (locationAddress) joinHtml += `<p style="margin:8px 0"><strong>In-Person:</strong> ${locationAddress}</p>`
    if (meetingUrl) joinHtml += `<p style="margin:8px 0"><strong>Online:</strong> <a href="${meetingUrl}" style="color:#1a3a2a">${meetingUrl}</a></p>`
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#1a3a2a">Workshop Reminder</h2>
      <p>This is a reminder that <strong>${workshopTitle}</strong> is happening tomorrow!</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Workshop:</strong> ${workshopTitle}</p>
        <p style="margin:4px 0"><strong>Date:</strong> ${dateStr}</p>
        ${joinHtml}
      </div>
      <p style="color:#666">We look forward to seeing you there!</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
      <p style="font-size:12px;color:#999">Textile Impressions - Skills Studio</p>
    </div>
  `
}