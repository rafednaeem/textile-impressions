import { getBusinessSettings, getFromEmail } from "./config"
import { getServiceRoleClient } from "@/lib/supabase/service-role"
import { getEmailProvider } from "./providers"

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  template?: string
  dedupKey?: string
  metadata?: Record<string, unknown>
}

export type EmailResult =
  | { success: true; messageId: string }
  | { success: false; error: string }

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  let provider
  try {
    provider = getEmailProvider()
  } catch (initErr) {
    const message = initErr instanceof Error ? initErr.message : "Provider initialization failed"
    console.warn(`[email] Provider init failed: ${message}`)
    return { success: false, error: message }
  }

  const business = await getBusinessSettings()
  const from = getFromEmail(business)

  try {
    const result = await provider.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    if (!result.success) {
      console.error(`[email] Send error via ${provider.name}:`, result.error)
      await logEmail({
        recipient: params.to,
        subject: params.subject,
        template: params.template || "unknown",
        status: "failed",
        error: result.error,
        dedupKey: params.dedupKey,
        metadata: params.metadata,
      })
      return { success: false, error: result.error }
    }

    await logEmail({
      recipient: params.to,
      subject: params.subject,
      template: params.template || "unknown",
      status: "sent",
      messageId: result.messageId,
      dedupKey: params.dedupKey,
      metadata: params.metadata,
    })

    console.log(`[email] Sent via ${provider.name}: "${params.subject}" to ${params.to}`)
    return { success: true, messageId: result.messageId }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error(`[email] Exception via ${provider.name}:`, message)
    await logEmail({
      recipient: params.to,
      subject: params.subject,
      template: params.template || "unknown",
      status: "failed",
      error: message,
      dedupKey: params.dedupKey,
      metadata: params.metadata,
    })
    return { success: false, error: message }
  }
}

export async function sendEmailWithRetry(
  params: SendEmailParams,
  maxAttempts = 3,
): Promise<EmailResult> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await sendEmail(params)
    if (result.success) return result

    if (attempt < maxAttempts) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
      console.log(`[email] Retry ${attempt}/${maxAttempts} in ${delay}ms: "${params.subject}"`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  return { success: false, error: `Failed after ${maxAttempts} attempts` }
}

export async function checkDuplicateEmail(dedupKey: string, withinMinutes = 1440): Promise<boolean> {
  if (!dedupKey) return false

  try {
    const serviceRole = getServiceRoleClient()
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString()

    const { data } = await serviceRole
      .from("email_logs")
      .select("id, status")
      .eq("dedup_key", dedupKey)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const last = data[0]
      if (last.status === "sent") {
        console.log(`[email] Duplicate blocked: dedup_key=${dedupKey} (sent at recent)`)
        return true
      }
    }

    return false
  } catch (err) {
    console.error("[email] Dedup check error:", err)
    return false
  }
}

interface LogEmailParams {
  recipient: string
  subject: string
  template: string
  status: "sent" | "failed" | "bounced" | "dropped"
  messageId?: string
  error?: string
  dedupKey?: string
  metadata?: Record<string, unknown>
}

async function logEmail(params: LogEmailParams): Promise<void> {
  try {
    const serviceRole = getServiceRoleClient()
    await serviceRole.from("email_logs").insert({
      recipient: params.recipient,
      subject: params.subject,
      template: params.template,
      status: params.status,
      message_id: params.messageId || null,
      error: params.error || null,
      dedup_key: params.dedupKey || null,
      metadata: params.metadata || {},
    })
  } catch (err) {
    console.error("[email] Logging error:", err)
  }
}
