import type { BusinessSettings } from "../config"

export function baseLayout(
  content: string,
  business: BusinessSettings,
  previewText?: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  ${previewText ? `<!--[if !mso]><!-->
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(previewText)}
  </div>
  <!--<![endif]-->` : ""}
  <title>${business.store_name}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;min-width:100%;">
    <tr>
      <td align="center" style="padding:30px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a3a2a;border-radius:8px 8px 0 0;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;font-family:Georgia,'Times New Roman',serif;">
                ${business.store_name}
              </h1>
              <p style="margin:4px 0 0;color:#a8c5b8;font-size:12px;font-weight:400;letter-spacing:2px;text-transform:uppercase;">
                Handcrafted Pakistani Fashion
              </p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 32px 24px;">
              ${content}
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="background-color:#ffffff;padding:0 32px;">
              <div style="height:1px;background-color:#e5e5e5;margin:0;"></div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#ffffff;border-radius:0 0 8px 8px;padding:24px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 6px;color:#999999;font-size:13px;line-height:1.5;">
                      <strong style="color:#666666;">${escapeHtml(business.store_name)}</strong><br>
                      ${escapeHtml(business.store_address)}
                    </p>
                    <p style="margin:0 0 6px;color:#999999;font-size:13px;line-height:1.5;">
                      Phone: <a href="tel:${escapeHtml(business.store_phone)}" style="color:#1a3a2a;text-decoration:none;">${escapeHtml(business.store_phone)}</a>
                      &nbsp;|&nbsp; Email: <a href="mailto:${escapeHtml(business.store_email)}" style="color:#1a3a2a;text-decoration:none;">${escapeHtml(business.store_email)}</a>
                    </p>
                    <p style="margin:0 0 6px;color:#999999;font-size:13px;">
                      WhatsApp: <a href="https://wa.me/${business.store_whatsapp}" style="color:#1a3a2a;text-decoration:none;">${business.store_whatsapp}</a>
                    </p>
                    <p style="margin:0;color:#bbbbbb;font-size:11px;line-height:1.4;padding-top:12px;">
                      This email was sent by ${escapeHtml(business.store_name)}. If you have any questions, please contact us.
                      <br>${escapeHtml(business.store_website)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function sectionBox(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:6px;margin:12px 0;">
    <tr><td style="padding:16px;">${content}</td></tr>
  </table>`
}

export function ctaButton(url: string, text: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="border-radius:6px;background-color:#c65d47;">
              <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;font-family:inherit;">
                ${escapeHtml(text)}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

export function statusBadge(label: string, color: string): string {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;color:#ffffff;background-color:${color};">${escapeHtml(label)}</span>`
}
