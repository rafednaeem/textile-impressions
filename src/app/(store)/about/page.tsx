import type { Metadata } from "next"
import Script from "next/script"
import { storeName, baseUrl } from "@/lib/constants"
import { canonicalUrl, breadcrumbSchema } from "@/lib/seo"
import AboutContent from "./AboutContent"

export const metadata: Metadata = {
  title: `About — ${storeName}`,
  description:
    "Textile Impressions is a first-of-its-kind facility advancing Pakistan’s social development through education, sampling, and production in textiles.",
  alternates: { canonical: canonicalUrl("/about") },
  openGraph: {
    title: `About — ${storeName}`,
    description: "Education, sampling & production for Pakistan’s textile future.",
    url: `${baseUrl}/about`,
    type: "website",
  },
}

export default function AboutPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: canonicalUrl("/") },
    { name: "About", url: canonicalUrl("/about") },
  ])

  return (
    <>
      <Script id="breadcrumb-about" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumb)}
      </Script>
      <AboutContent />
    </>
  )
}
