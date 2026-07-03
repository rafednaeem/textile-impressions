import Script from "next/script"
import type { Metadata } from "next"
import { storeName, baseUrl } from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"
import { extractSettings } from "@/lib/settings"
import { canonicalUrl, organizationSchema, websiteSchema, breadcrumbSchema } from "@/lib/seo"
import { withTimeout } from "@/lib/promise-timeout"
import HomeContent from "./HomeContent"

export const revalidate = 600

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: storeName + " — Handcrafted Pakistani Fashion",
    description:
      "Discover handcrafted Pakistani fashion blending traditional craftsmanship with contemporary elegance. Shop our curated collection of premium textiles and garments.",
    alternates: { canonical: canonicalUrl("/") },
    openGraph: {
      title: storeName,
      description:
        "Discover handcrafted Pakistani fashion blending traditional craftsmanship with contemporary elegance.",
      url: baseUrl,
      siteName: storeName,
      images: [{ url: `${baseUrl}/og-home.jpg`, width: 1200, height: 630 }],
      locale: "en_PK",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: storeName,
      description:
        "Discover handcrafted Pakistani fashion blending traditional craftsmanship with contemporary elegance.",
    },
  }
}

export default async function HomePage() {
  let whatsapp = "923001234567"
  try {
    const supabase = await createClient()
    const { data } = await withTimeout(
      supabase.from("site_settings").select("key, value"),
      5000,
      { data: null }
    )
    const s = extractSettings(data)
    if (s.store_whatsapp) whatsapp = s.store_whatsapp
  } catch (error) {
    console.error("[HomePage] Failed to load site settings:", error)
  }

  const orgSchema = {
    ...organizationSchema,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+${whatsapp}`,
      contactType: "customer service",
      availableLanguage: ["English", "Urdu"],
    },
    sameAs: [
      `https://wa.me/${whatsapp}`,
      "https://facebook.com/textileimpressions",
      "https://instagram.com/textileimpressions",
    ],
  }

  return (
    <>
      <Script id="organization-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(orgSchema)}
      </Script>
      <Script id="website-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(websiteSchema())}
      </Script>
      <Script id="breadcrumb-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumbSchema([{ name: "Home", url: canonicalUrl("/") }]))}
      </Script>
      <HomeContent />
    </>
  )
}
