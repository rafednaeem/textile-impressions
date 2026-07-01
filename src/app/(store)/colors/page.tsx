import type { Metadata } from "next"
import Script from "next/script"
import { storeName, baseUrl } from "@/lib/constants"
import { canonicalUrl, breadcrumbSchema } from "@/lib/seo"
import ColorsContent from "./ColorsContent"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Sustainable Colors & Paints - ${storeName}`,
    description: "Explore our range of sustainable textile colors - natural dyes, block printing paints, and fabric paints. Eco-friendly, artisan-crafted for your creative projects.",
    alternates: { canonical: canonicalUrl("/colors") },
    openGraph: {
      title: `Sustainable Colors & Paints - ${storeName}`,
      description: "Eco-friendly textile colors crafted by Pakistani artisans.",
      url: `${baseUrl}/colors`,
      type: "website",
    },
  }
}

export default function ColorsPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: canonicalUrl("/") },
    { name: "Colors & Paints", url: canonicalUrl("/colors") },
  ])

  return (
    <>
      <Script id="breadcrumb-colors" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumb)}
      </Script>
      <ColorsContent />
    </>
  )
}
