import { getServiceRoleClient } from "@/lib/supabase/service-role"
import { extractSettings } from "@/lib/settings"

export interface BusinessSettings {
  store_name: string
  store_email: string
  store_phone: string
  store_whatsapp: string
  store_address: string
  store_website: string
  bank_name: string
  bank_account: string
  bank_iban: string
  bank_account_title: string
}

const DEFAULTS: BusinessSettings = {
  store_name: "Textile Impressions",
  store_email: "hello@textileimpressions.com",
  store_phone: "+92 300 1234567",
  store_whatsapp: "923001234567",
  store_address: "Lahore, Pakistan",
  store_website: process.env.NEXT_PUBLIC_SITE_URL || "https://textileimpressions.com",
  bank_name: "Meezan Bank",
  bank_account: "1234567890",
  bank_iban: "PK36MEZN0001234567890",
  bank_account_title: "Textile Impressions",
}

let cachedSettings: BusinessSettings | null = null
let lastFetch = 0
const CACHE_TTL = 300_000

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const now = Date.now()
  if (cachedSettings && now - lastFetch < CACHE_TTL) {
    return cachedSettings
  }

  try {
    const serviceRole = getServiceRoleClient()
    const { data } = await serviceRole
      .from("site_settings")
      .select("key, value")

    if (!data) {
      cachedSettings = { ...DEFAULTS }
      lastFetch = now
      return cachedSettings
    }

    const s = extractSettings(data)
    cachedSettings = {
      store_name: "Textile Impressions",
      store_email: s.store_email || DEFAULTS.store_email,
      store_phone: s.store_phone || DEFAULTS.store_phone,
      store_whatsapp: s.store_whatsapp || DEFAULTS.store_whatsapp,
      store_address: s.store_address || DEFAULTS.store_address,
      store_website: DEFAULTS.store_website,
      bank_name: s.bank_name || DEFAULTS.bank_name,
      bank_account: s.bank_account || DEFAULTS.bank_account,
      bank_iban: s.bank_iban || DEFAULTS.bank_iban,
      bank_account_title: s.bank_account_title || DEFAULTS.bank_account_title,
    }
    lastFetch = now
    return cachedSettings
  } catch {
    cachedSettings = { ...DEFAULTS }
    lastFetch = now
    return cachedSettings
  }
}

export function getFromEmail(business: BusinessSettings): string {
  return `Textile Impressions <${business.store_email}>`
}
