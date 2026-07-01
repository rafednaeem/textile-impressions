import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/seo"
import { createClient } from "@/lib/supabase/server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const staticPages = [
    { url: siteUrl, priority: 1, changeFrequency: "weekly" as const },
    { url: `${siteUrl}/shop`, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${siteUrl}/craft-guide`, priority: 0.6, changeFrequency: "monthly" as const },
    { url: `${siteUrl}/lookbook`, priority: 0.7, changeFrequency: "weekly" as const },
    { url: `${siteUrl}/colors`, priority: 0.5, changeFrequency: "weekly" as const },
    { url: `${siteUrl}/skills-studio`, priority: 0.8, changeFrequency: "daily" as const },
    { url: `${siteUrl}/custom-orders`, priority: 0.5, changeFrequency: "monthly" as const },
    { url: `${siteUrl}/incubator`, priority: 0.6, changeFrequency: "monthly" as const },
  ]

  const [{ data: products }, { data: categories }, { data: workshops }] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("is_published", true),
    supabase.from("categories").select("slug, updated_at"),
    supabase.from("workshops").select("slug, updated_at").eq("status", "published").not("slug", "is", null),
  ])

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${siteUrl}/products/${p.slug}`,
    priority: 0.8,
    changeFrequency: "weekly",
    lastModified: new Date(p.updated_at),
  }))

  const categoryUrls: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${siteUrl}/shop?category=${c.slug}`,
    priority: 0.7,
    changeFrequency: "weekly",
    lastModified: new Date(c.updated_at),
  }))

  const workshopUrls: MetadataRoute.Sitemap = (workshops ?? []).map((w) => ({
    url: `${siteUrl}/skills-studio/${w.slug}`,
    priority: 0.8,
    changeFrequency: "weekly",
    lastModified: new Date(w.updated_at),
  }))

  return [...staticPages, ...productUrls, ...categoryUrls, ...workshopUrls]
}
