import { Resend } from "resend"
import type { EmailProvider, SendParams, SendResult } from "./types"

export class ResendProvider implements EmailProvider {
  readonly name = "resend"
  private client: Resend

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is required for Resend provider")
    }
    this.client = new Resend(process.env.RESEND_API_KEY)
  }

  async send(params: SendParams): Promise<SendResult> {
    const { data, error } = await this.client.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id || "" }
  }
}
