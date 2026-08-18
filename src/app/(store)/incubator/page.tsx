import type { Metadata } from "next"
import Script from "next/script"
import { storeName, baseUrl } from "@/lib/constants"
import { canonicalUrl, breadcrumbSchema } from "@/lib/seo"
import { defaultWebsiteContent } from "@/lib/website-content"
import { getPageWebsiteContent } from "@/lib/website-content/server"
import IncubatorContent from "./IncubatorContent"

export const metadata: Metadata = {
  title: `Incubator — ${storeName}`,
  description:
    "Pakistan's first textile cottage industry incubator. A fashion studio and support system for artisans, home-based makers, and small textile businesses.",
  alternates: { canonical: canonicalUrl("/incubator") },
  openGraph: {
    title: `Incubator — ${storeName}`,
    description: "Pakistan's first textile cottage industry incubator.",
    url: `${baseUrl}/incubator`,
    type: "website",
  },
}

export default async function IncubatorPage() {
  let content = defaultWebsiteContent.incubator
  try {
    content = await getPageWebsiteContent("incubator")
  } catch (error) {
    console.error("[IncubatorPage] Failed to load content:", error)
  }

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: canonicalUrl("/") },
    { name: "Incubator", url: canonicalUrl("/incubator") },
  ])

  return (
    <>
      <Script id="breadcrumb-incubator" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumb)}
      </Script>
      <IncubatorContent content={content} />
    </>
  )
}
