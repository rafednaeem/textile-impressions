import nodemailer from "nodemailer"
import type { EmailProvider, SendParams, SendResult } from "./types"

export class SMTPProvider implements EmailProvider {
  readonly name = "smtp"
  private transporter: nodemailer.Transporter

  constructor() {
    const host = process.env.SMTP_HOST
    const port = parseInt(process.env.SMTP_PORT || "587", 10)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const secure = process.env.SMTP_SECURE === "true"

    if (!host || !user || !pass) {
      throw new Error(
        "SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables are required for SMTP provider"
      )
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })
  }

  async send(params: SendParams): Promise<SendResult> {
    try {
      const info = await this.transporter.sendMail({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      })

      return { success: true, messageId: info.messageId }
    } catch (err) {
      const message = err instanceof Error ? err.message : "SMTP send failed"
      return { success: false, error: message }
    }
  }
}
