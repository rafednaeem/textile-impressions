import "server-only"

import { createClient } from "@/lib/supabase/server"
import {
  defaultWebsiteContent,
  mergeContent,
  type WebsiteContentPage,
} from "@/lib/website-content"

export async function getWebsiteContent(page?: WebsiteContentPage) {
  const supabase = await createClient()
  let query = supabase.from("website_content").select("*")
  if (page) query = query.eq("page", page)
  const { data } = await query.order("section").order("field")
  const merged = mergeContent(data)
  if (page) return merged[page]
  return merged
}

export async function getAllWebsiteContent(): Promise<typeof defaultWebsiteContent> {
  return getWebsiteContent() as Promise<typeof defaultWebsiteContent>
}

export async function getPageWebsiteContent(page: WebsiteContentPage) {
  return getWebsiteContent(page) as Promise<typeof defaultWebsiteContent[WebsiteContentPage]>
}
