import type { EmailProvider, SendParams, SendResult } from "./types"

export class ConsoleProvider implements EmailProvider {
  readonly name = "log"

  async send(params: SendParams): Promise<SendResult> {
    const border = "─".repeat(60)
    console.log(`
${border}
[EMAIL:console] To: ${params.to}
[EMAIL:console] Subject: ${params.subject}
[EMAIL:console] From: ${params.from}
${border}
${params.html}
${border}
    `.trim())

    return { success: true, messageId: `console-${Date.now()}` }
  }
}
