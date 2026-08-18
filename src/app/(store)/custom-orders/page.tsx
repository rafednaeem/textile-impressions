import type { Metadata } from "next"
import Script from "next/script"
import { storeName, baseUrl } from "@/lib/constants"
import { canonicalUrl, breadcrumbSchema } from "@/lib/seo"
import { defaultWebsiteContent } from "@/lib/website-content"
import { getPageWebsiteContent } from "@/lib/website-content/server"
import CustomOrdersContent from "./CustomOrdersContent"

export const metadata: Metadata = {
  title: `Custom Orders — ${storeName}`,
  description: "Commission a bespoke piece from Textile Impressions. Share your fabric, fit, color, and deadline preferences.",
  alternates: { canonical: canonicalUrl("/custom-orders") },
  openGraph: {
    title: `Custom Orders — ${storeName}`,
    description: "Commission a bespoke piece from Textile Impressions.",
    url: `${baseUrl}/custom-orders`,
    type: "website",
  },
}

export default async function CustomOrdersPage() {
  let content = defaultWebsiteContent["custom-orders"]
  try {
    content = await getPageWebsiteContent("custom-orders")
  } catch (error) {
    console.error("[CustomOrdersPage] Failed to load content:", error)
  }

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: canonicalUrl("/") },
    { name: "Custom Orders", url: canonicalUrl("/custom-orders") },
  ])

  return (
    <>
      <Script id="breadcrumb-custom-orders" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumb)}
      </Script>
      <CustomOrdersContent content={content} />
    </>
  )
}
