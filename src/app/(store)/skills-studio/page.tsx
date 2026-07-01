import type { Metadata } from "next"
import Script from "next/script"
import { storeName, baseUrl } from "@/lib/constants"
import { canonicalUrl, breadcrumbSchema } from "@/lib/seo"
import SkillsStudioContent from "./SkillsStudioContent"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Skills Studio — ${storeName}`,
    description: "Learn. Create. Earn. Professional textile craft training for everyone. Join our workshops in natural dyeing, block printing, and fabric painting.",
    alternates: { canonical: canonicalUrl("/skills-studio") },
    openGraph: {
      title: `Skills Studio — ${storeName}`,
      description: "Professional textile craft training for everyone.",
      url: `${baseUrl}/skills-studio`,
      type: "website",
    },
  }
}

export default function SkillsStudioPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: canonicalUrl("/") },
    { name: "Skills Studio", url: canonicalUrl("/skills-studio") },
  ])

  return (
    <>
      <Script id="breadcrumb-skills-studio" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumb)}
      </Script>
      <SkillsStudioContent />
    </>
  )
}
