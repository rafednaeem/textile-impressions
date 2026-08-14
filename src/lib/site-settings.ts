import { createClient } from "@/lib/supabase/client"

let cache: Record<string, string> | null = null
let cachePromise: Promise<Record<string, string>> | null = null

async function fetchSettings(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data, error } = await supabase.from("site_settings").select("key, value")
  if (error) {
    console.error("[site-settings] Failed to load settings:", error)
    return {}
  }
  const map: Record<string, string> = {}
  data?.forEach((s) => {
    map[s.key] = s.value
  })
  return map
}

export async function getSiteSettings(): Promise<Record<string, string>> {
  if (cache) return cache
  if (!cachePromise) {
    cachePromise = fetchSettings().then((map) => {
      cache = map
      return map
    })
  }
  return cachePromise
}

export function clearSiteSettingsCache(): void {
  cache = null
  cachePromise = null
}
