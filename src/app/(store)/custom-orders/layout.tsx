import type { Metadata } from "next"
import Script from "next/script"
import { storeName, baseUrl } from "@/lib/constants"
import { canonicalUrl, breadcrumbSchema } from "@/lib/seo"

export const metadata: Metadata = {
  title: `Custom Orders — ${storeName}`,
  description: "Commission a bespoke handcrafted piece. Share your fabric, fit, color, and deadline preferences. Our studio will bring your vision to life.",
  alternates: { canonical: canonicalUrl("/custom-orders") },
  openGraph: {
    title: `Custom Orders — ${storeName}`,
    description: "Commission a bespoke handcrafted piece from Pakistani artisans.",
    url: `${baseUrl}/custom-orders`,
    type: "website",
  },
}

export default function CustomOrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script id="breadcrumb-custom-orders" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumbSchema([
          { name: "Home", url: canonicalUrl("/") },
          { name: "Custom Orders", url: canonicalUrl("/custom-orders") },
        ]))}
      </Script>
      {children}
    </>
  )
}
