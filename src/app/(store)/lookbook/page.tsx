import type { Metadata } from "next"
import Script from "next/script"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { storeName, baseUrl } from "@/lib/constants"
import { canonicalUrl, breadcrumbSchema } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Lookbook — ${storeName}`,
    description: "Explore our editorial collections — curated textile stories featuring handcrafted Pakistani fashion, block prints, Ajrak, and artisan craftsmanship.",
    alternates: { canonical: canonicalUrl("/lookbook") },
    openGraph: {
      title: `Lookbook — ${storeName}`,
      description: "Curated textile stories from Pakistan.",
      url: `${baseUrl}/lookbook`,
      images: [{ url: `${baseUrl}/og-home.jpg`, width: 1200, height: 630 }],
    },
  }
}

type LookbookCollection = {
  id: string
  name: string
  slug: string
  description: string | null
  hero_image_url: string | null
  season: string | null
  year: number | null
  collection_products?: {
    sort_order: number
    editorial_note: string | null
    products: {
      name: string
      slug: string
      price: number
      sale_price: number | null
      craft_type: string | null
    } | null
  }[]
}

const fallbackCollections: LookbookCollection[] = [
  {
    id: "indigo-courtyard",
    name: "Indigo Courtyard",
    slug: "indigo-courtyard",
    description: "Ajrak blues, relaxed tailoring, and quiet hand-finished details for long summer evenings.",
    hero_image_url: "https://picsum.photos/seed/indigo-courtyard/1200/820",
    season: "Summer",
    year: 2026,
    collection_products: [
      {
        sort_order: 1,
        editorial_note: "Pair with bare sandals and a handwoven dupatta for a restrained festive look.",
        products: { name: "Ajrak Cotton Kurta", slug: "ajrak-cotton-kurta", price: 12500, sale_price: null, craft_type: "Ajrak" },
      },
    ],
  },
  {
    id: "saffron-workshop",
    name: "Saffron Workshop",
    slug: "saffron-workshop",
    description: "Block printed separates built around saffron, ivory, and deep umber accents.",
    hero_image_url: "https://picsum.photos/seed/saffron-workshop/1200/820",
    season: "Festive",
    year: 2026,
    collection_products: [
      {
        sort_order: 1,
        editorial_note: "A polished day-to-evening piece with the warmth of cottage craft.",
        products: { name: "Block Print Co-ord", slug: "block-print-coord", price: 16800, sale_price: null, craft_type: "Block Print" },
      },
    ],
  },
]

export default async function LookbookPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("collections")
    .select("*, collection_products(sort_order, editorial_note, products(name, slug, price, sale_price, craft_type))")
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  const collections = (data?.length ? data : fallbackCollections) as LookbookCollection[]

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: canonicalUrl("/") },
    { name: "Lookbook", url: canonicalUrl("/lookbook") },
  ])

  return (
    <>
      <Script id="breadcrumb-lookbook" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumb)}
      </Script>
      <div className="bg-brand-ivory pb-20 pt-28 text-brand-umber">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">Lookbook</p>
          <h1 className="mt-4 font-heading text-5xl font-semibold text-brand-indigo">Editorial collections</h1>
        </div>

        <div className="mt-10 space-y-16">
          {collections.map((collection, index) => {
            const primary = collection.collection_products?.sort((a, b) => a.sort_order - b.sort_order)[0]
            const product = primary?.products
            return (
              <section key={collection.id} className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
                <div className={`relative min-h-[420px] overflow-hidden rounded-lg ${index % 2 ? "md:order-2" : ""}`}>
                  <Image src={collection.hero_image_url || `https://picsum.photos/seed/${collection.slug}/1200/820`} alt={collection.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-crimson">
                      {[collection.season, collection.year].filter(Boolean).join(" ")}
                    </p>
                    <h2 className="mt-3 font-heading text-4xl font-semibold text-brand-indigo">{collection.name}</h2>
                    <p className="mt-4 leading-7 text-muted-foreground">{collection.description}</p>
                    {product && (
                      <div className="mt-8 border-l-2 border-brand-saffron pl-5">
                        <p className="text-sm uppercase tracking-[0.14em] text-muted-foreground">{product.craft_type}</p>
                        <h3 className="mt-2 font-heading text-2xl font-semibold">{product.name}</h3>
                        {primary?.editorial_note && <p className="mt-2 text-sm leading-6 text-muted-foreground">{primary.editorial_note}</p>}
                        <Link href={`/products/${product.slug}`} className="mt-4 inline-flex rounded-full bg-brand-indigo px-5 py-2 text-sm font-bold text-brand-ivory">
                          View piece
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </>
  )
}
