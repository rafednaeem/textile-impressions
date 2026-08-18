import type { Metadata } from "next"
import Script from "next/script"
import Image from "next/image"
import { canonicalUrl, breadcrumbSchema } from "@/lib/seo"
import { storeName } from "@/lib/constants"
import { defaultWebsiteContent } from "@/lib/website-content"
import { getPageWebsiteContent } from "@/lib/website-content/server"

export const metadata: Metadata = {
  title: `Pakistani Textile Craft Guide — ${storeName}`,
  description:
    "Learn about block printing in Pakistan, Ajrak, natural dyes, and caring for handcrafted textiles.",
  alternates: { canonical: canonicalUrl("/craft-guide") },
  keywords: [
    "what is block printing Pakistan",
    "Ajrak textile Pakistan",
    "natural dyes Pakistan",
    "handcrafted textile care",
  ],
}

const articleImages = [
  "https://picsum.photos/seed/block-print-guide/1200/720",
  "https://picsum.photos/seed/ajrak-guide/1200/720",
  "https://picsum.photos/seed/natural-dyes-guide/1200/720",
  "https://picsum.photos/seed/textile-care-guide/1200/720",
]

export default async function CraftGuidePage() {
  let content = defaultWebsiteContent["craft-guide"]
  try {
    content = await getPageWebsiteContent("craft-guide")
  } catch (error) {
    console.error("[CraftGuidePage] Failed to load content:", error)
  }

  const articles = [
    {
      title: content.article_1.title,
      tag: content.article_1.tag,
      image: articleImages[0],
      body: [content.article_1.body_1, content.article_1.body_2, content.article_1.body_3],
    },
    {
      title: content.article_2.title,
      tag: content.article_2.tag,
      image: articleImages[1],
      body: [content.article_2.body_1, content.article_2.body_2, content.article_2.body_3],
    },
    {
      title: content.article_3.title,
      tag: content.article_3.tag,
      image: articleImages[2],
      body: [content.article_3.body_1, content.article_3.body_2, content.article_3.body_3],
    },
    {
      title: content.article_4.title,
      tag: content.article_4.tag,
      image: articleImages[3],
      body: [content.article_4.body_1, content.article_4.body_2, content.article_4.body_3],
    },
  ]

  return (
    <>
      <Script id="breadcrumb-craft-guide" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumbSchema([
          { name: "Home", url: canonicalUrl("/") },
          { name: "Craft Guide", url: canonicalUrl("/craft-guide") },
        ]))}
      </Script>
      <div className="bg-brand-ivory pb-20 pt-28 text-brand-umber">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">{content.page_intro.label}</p>
          <h1 className="mt-4 font-heading text-5xl font-semibold text-brand-indigo">{content.page_intro.heading}</h1>
        </div>
        <div className="mx-auto mt-12 max-w-4xl space-y-16 px-4 sm:px-6 lg:px-8">
          {articles.map((article) => (
            <article key={article.title} className="overflow-hidden rounded-lg border border-border bg-white">
              <div className="relative aspect-[5/3]">
                <Image src={article.image} alt={article.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 896px" />
              </div>
              <div className="p-6 sm:p-8">
                <span className="inline-flex rounded-full bg-brand-saffron/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-crimson">
                  {article.tag}
                </span>
                <h2 className="mt-4 font-heading text-4xl font-semibold text-brand-indigo">{article.title}</h2>
                <div className="mt-5 space-y-4 leading-7 text-muted-foreground">
                  {article.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  )
}
