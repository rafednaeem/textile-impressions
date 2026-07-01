export interface SendParams {
  from: string
  to: string
  subject: string
  html: string
}

export type SendResult =
  | { success: true; messageId: string }
  | { success: false; error: string }

export interface EmailProvider {
  readonly name: string
  send(params: SendParams): Promise<SendResult>
}

export type EmailProviderType = "resend" | "smtp" | "log"
