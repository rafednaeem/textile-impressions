import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/account/", "/auth/", "/api/", "/checkout/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
