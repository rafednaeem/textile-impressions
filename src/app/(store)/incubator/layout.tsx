import type { Metadata } from "next"
import Script from "next/script"
import { storeName, baseUrl } from "@/lib/constants"
import { canonicalUrl, breadcrumbSchema } from "@/lib/seo"

export const metadata: Metadata = {
  title: `Incubator — ${storeName}`,
  description: "Pakistan's first textile cottage industry incubator. A fashion studio and support system for artisans, home-based makers, and small textile businesses.",
  alternates: { canonical: canonicalUrl("/incubator") },
  openGraph: {
    title: `Incubator — ${storeName}`,
    description: "Pakistan's first textile cottage industry incubator.",
    url: `${baseUrl}/incubator`,
    type: "website",
  },
}

export default function IncubatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script id="breadcrumb-incubator" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumbSchema([
          { name: "Home", url: canonicalUrl("/") },
          { name: "Incubator", url: canonicalUrl("/incubator") },
        ]))}
      </Script>
      {children}
    </>
  )
}
