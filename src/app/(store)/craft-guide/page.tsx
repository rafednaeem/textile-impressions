import type { Metadata } from "next"
import Script from "next/script"
import Image from "next/image"
import { canonicalUrl, breadcrumbSchema } from "@/lib/seo"
import { storeName } from "@/lib/constants"

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

const articles = [
  {
    title: "What is block printing?",
    tag: "Block Print",
    image: "https://picsum.photos/seed/block-print-guide/1200/720",
    body: [
      "Block printing is one of Pakistan's most recognizable textile crafts: a method of creating repeat patterns by pressing carved wooden blocks onto fabric. Each block carries a portion of the design, so a finished garment may pass through many careful impressions before the pattern feels complete. The beauty of the process is its human rhythm. Small variations in pressure, dye absorption, and alignment give the cloth a character that machine printing rarely keeps.",
      "In Punjab and Sindh, block printing often appears on cottons, lawns, khaddar, dupattas, and home textiles. Artisans may use floral butis, borders, geometric repeats, or regional motifs that have moved through generations of workshops. The process usually begins with fabric preparation, then color mixing, block alignment, printing, drying, washing, and finishing. Natural and pigment dyes both appear in contemporary practice, depending on the studio and intended use.",
      "For customers, block printed pieces offer a way to wear craft without treating it as costume. A printed kurta or dupatta can feel relaxed, modern, and deeply rooted at the same time. Textile Impressions works with makers who understand that balance: the print should honor the hand, but the final garment still needs clean finishing, strong fabric, and everyday ease.",
    ],
  },
  {
    title: "The art of Ajrak",
    tag: "Ajrak",
    image: "https://picsum.photos/seed/ajrak-guide/1200/720",
    body: [
      "Ajrak is a celebrated textile tradition associated strongly with Sindh, recognized for deep indigo, madder-like reds, black outlines, and intricate geometric symmetry. Traditional Ajrak uses resist printing and repeated dye stages, building pattern and color through patience rather than speed. The cloth carries cultural memory: it is worn as a shawl, gifted with respect, and used as a visual marker of identity across communities.",
      "The craft is technically demanding. A single piece can move through washing, mordanting, resist application, dyeing, sun drying, and repeated printing stages. Even when contemporary studios create Ajrak-inspired garments with lighter processes or modern silhouettes, the best work keeps the discipline of balance: dense pattern, controlled contrast, and a respect for the geometry that makes Ajrak so powerful.",
      "In fashion, Ajrak can be styled beyond the classic shawl. It works beautifully as a statement kurta, a panel on a minimal co-ord, a dupatta over ivory, or a structured accent in menswear-inspired tailoring. The key is restraint. Let the pattern breathe, pair it with quiet fabrics, and allow its indigo depth to lead the look.",
    ],
  },
  {
    title: "Natural vs synthetic dyes",
    tag: "Dyes",
    image: "https://picsum.photos/seed/natural-dyes-guide/1200/720",
    body: [
      "Natural dyes come from plant, mineral, or other organic sources, while synthetic dyes are chemically produced for consistency, range, and scale. Neither category is automatically good or bad in every context. Natural dyes can offer remarkable softness, tonal complexity, and a link to older textile practices. Synthetic dyes can provide durability, repeatability, and affordability for larger production runs.",
      "The real question is how responsibly the dye is used. Natural dyeing still requires water, mordants, labor, and technical knowledge. Poor handling can waste resources or create uneven results. Synthetic dyeing can be safe and efficient when managed with proper controls, but it can also become harmful when wastewater and chemicals are mishandled. A thoughtful textile studio considers colorfastness, skin comfort, environmental impact, and the intended life of the garment.",
      "For handcrafted fashion, natural dyes are especially loved for their living quality. Indigo may shift gently with wear, earthy yellows can soften over time, and hand-dyed cloth often carries subtle movement in tone. Customers should expect this character and care for it properly. Wash gently, avoid harsh detergents, dry away from strong sun, and treat color variation as part of the textile's story.",
    ],
  },
  {
    title: "How to care for handcrafted textiles",
    tag: "Care",
    image: "https://picsum.photos/seed/textile-care-guide/1200/720",
    body: [
      "Handcrafted textiles deserve care that protects the fabric, dye, and handwork. Start by reading the garment label, then choose the gentlest practical method. Many block printed, embroidered, naturally dyed, or delicate cotton pieces last longer when washed separately in cold water with a mild detergent. Avoid bleach, strong stain removers, and long soaking unless a care label specifically allows it.",
      "Drying matters as much as washing. Direct, harsh sunlight can fade dyes and weaken fibers, especially on richly colored or naturally dyed garments. Dry pieces inside out in shade, reshape them while damp, and avoid wringing embroidery or fine trims. If ironing is needed, use low to medium heat from the reverse side. For embellished garments, place a cotton cloth between the iron and the fabric.",
      "Storage is another quiet form of care. Fold heavier embroidered items instead of hanging them for long periods, because weight can pull the garment out of shape. Keep textiles clean and fully dry before storing. Use breathable garment bags for special pieces, and give seasonal clothes a little air from time to time. Good care turns a handcrafted garment into something that can be worn often, repaired if needed, and kept in the wardrobe for years.",
    ],
  },
]

export default function CraftGuidePage() {
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
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">Craft guide</p>
          <h1 className="mt-4 font-heading text-5xl font-semibold text-brand-indigo">Pakistani textile traditions, explained</h1>
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
