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