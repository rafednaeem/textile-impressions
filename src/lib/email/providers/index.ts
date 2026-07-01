import type { EmailProvider, EmailProviderType } from "./types"
import { ResendProvider } from "./resend"
import { SMTPProvider } from "./smtp"
import { ConsoleProvider } from "./console"

let cachedProvider: EmailProvider | null = null

export function getEmailProvider(): EmailProvider {
  if (cachedProvider) return cachedProvider

  const type: EmailProviderType =
    (process.env.EMAIL_PROVIDER as EmailProviderType) || "resend"

  switch (type) {
    case "smtp":
      cachedProvider = new SMTPProvider()
      break
    case "log":
      cachedProvider = new ConsoleProvider()
      break
    case "resend":
    default:
      cachedProvider = new ResendProvider()
      break
  }

  console.log(`[email] Using provider: ${cachedProvider.name}`)
  return cachedProvider
}

export type { EmailProvider, EmailProviderType }
export type { SendParams, SendResult } from "./types"
