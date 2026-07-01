import { storeName, baseUrl } from "./constants"

export const siteUrl = baseUrl
export const siteName = storeName
export const siteDescription = "Discover handcrafted Pakistani fashion — kurtas, dupattas, suits, co-ords, and accessories. Premium quality, traditional craftsmanship."
export const siteLocale = "en_PK"

export const defaultOgImage = `${siteUrl}/og-home.jpg`
export const ogImageWidth = 1200
export const ogImageHeight = 630

export const twitterHandle = "@textileimpressions"

export function canonicalUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`
  return `${siteUrl}${clean}`
}

export function truncate(str: string, max = 160): string {
  if (str.length <= max) return str
  return str.slice(0, max - 3) + "..."
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  foundingDate: "2024",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["English", "Urdu"],
  },
  sameAs: [
    `https://wa.me/923001234567`,
    "https://facebook.com/textileimpressions",
    "https://instagram.com/textileimpressions",
  ],
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
