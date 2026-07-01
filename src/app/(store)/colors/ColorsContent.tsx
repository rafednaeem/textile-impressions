"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Palette, Droplets, Brush, Leaf, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Product, Category } from "@/types/database"
import ProductCard from "@/components/store/ProductCard"

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 } as const,
  transition: { duration: 0.55 },
}

const colorCategories = [
  {
    title: "Natural Dyes",
    description: "Plant-based colors derived from madder root, indigo, pomegranate, and turmeric. Each batch carries the subtle variations that make hand-dyed textiles unique.",
    icon: Leaf,
    color: "bg-brand-forest/10 text-brand-forest",
    href: "/shop?category=natural-dyes",
  },
  {
    title: "Block Printing Paints",
    description: "Formulated for traditional hand-carved block printing. Rich pigmentation with smooth transfer on cotton, linen, and silk.",
    icon: Brush,
    color: "bg-brand-terracotta/10 text-brand-terracotta",
    href: "/shop?category=block-printing-paints",
  },
  {
    title: "Fabric Paints",
    description: "Versatile fabric paints for freehand painting, stenciling, and mixed media. Wash-resistant and designed for lasting vibrancy.",
    icon: Palette,
    color: "bg-brand-saffron/10 text-brand-umber",
    href: "/shop?category=fabric-paints",
  },
]

export default function ColorsContent() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("id")
        .in("slug", ["natural-dyes", "block-printing-paints", "fabric-paints"])

      if (!cats?.length) {
        setLoading(false)
        return
      }

      const catIds = cats.map((c) => c.id)
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .in("category_id", catIds)
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .limit(12)

      if (data) setProducts(data as Product[])
      setLoading(false)
    }
    fetchProducts()
  }, [supabase])

  return (
    <div className="bg-brand-ivory">
      <section className="relative overflow-hidden bg-brand-forest py-20 text-white sm:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-saffron/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-brand-indigo/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">Sustainable Colors</p>
            <h1 className="mt-4 font-heading text-4xl font-semibold sm:text-5xl lg:text-6xl">
              Colors rooted in nature
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80">
              From madder root reds to indigo blues — our palette is crafted by artisans using traditional methods
              that honor both craft and environment.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="mb-12">
          <h2 className="font-heading text-3xl font-semibold text-brand-indigo">Our Color Range</h2>
          <p className="mt-2 text-muted-foreground">
            Three categories of sustainable textile colors, each designed for different craft applications.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {colorCategories.map((cat) => (
            <motion.div key={cat.title} {...fadeUp}>
              <Link href={cat.href} className="group block overflow-hidden rounded-xl border border-border bg-white p-6 transition-shadow hover:shadow-lg">
                <div className={`inline-flex rounded-full p-3 ${cat.color}`}>
                  <cat.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-heading text-xl font-semibold text-brand-indigo group-hover:text-brand-terracotta transition-colors">
                  {cat.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {cat.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-terracotta group-hover:underline">
                  Explore collection <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mb-8">
            <h2 className="font-heading text-3xl font-semibold text-brand-indigo">Why Our Colors Matter</h2>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-2">
            <motion.div {...fadeUp} className="space-y-6">
              <div className="rounded-xl border border-border p-6">
                <h3 className="font-heading text-lg font-semibold text-brand-forest">Zero Synthetic Chemicals</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Our natural dye range uses only plant-based colorants. No heavy metals, no azo dyes, no formaldehyde.
                  Safe for artisans and safe for the people who wear the finished textiles.
                </p>
              </div>
              <div className="rounded-xl border border-border p-6">
                <h3 className="font-heading text-lg font-semibold text-brand-forest">Water-Based Formulas</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  All our block printing paints and fabric paints use water-based formulations that are easy to clean,
                  low-odor, and gentle on natural fibers like cotton and linen.
                </p>
              </div>
            </motion.div>
            <motion.div {...fadeUp} className="space-y-6">
              <div className="rounded-xl border border-border p-6">
                <h3 className="font-heading text-lg font-semibold text-brand-forest">Artisan Crafted</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Each color batch is prepared by hand by our artisan partners. The natural variations you see are not
                  defects — they are proof of human touch in an age of mass production.
                </p>
              </div>
              <div className="rounded-xl border border-border p-6">
                <h3 className="font-heading text-lg font-semibold text-brand-forest">Supporting Livelihoods</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Every purchase of our colors and paints directly supports the artisan families who prepare them.
                  Your creative projects become part of a larger story of sustainable craft livelihoods.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {products.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-3xl font-semibold text-brand-indigo">Shop Colors & Paints</h2>
                <p className="mt-2 text-sm text-muted-foreground">Browse our full collection of sustainable textile colors.</p>
              </div>
              <Link href="/shop" className="text-sm font-bold text-brand-terracotta hover:text-brand-indigo">View all products</Link>
            </motion.div>
            <motion.div {...fadeUp} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      <section className="bg-brand-indigo py-16 text-brand-ivory sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div {...fadeUp}>
            <h2 className="font-heading text-3xl font-semibold sm:text-4xl">Ready to create something beautiful?</h2>
            <p className="mt-4 text-lg text-brand-ivory/80">
              Whether you are a professional textile artist or just starting out, our sustainable colors are designed
              for your next project.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/shop" className="inline-flex h-12 items-center justify-center rounded-full bg-brand-saffron px-7 text-sm font-bold text-brand-umber transition hover:bg-brand-saffron/90">
                Shop Colors & Paints
              </Link>
              <Link href="/custom-orders" className="inline-flex h-12 items-center justify-center rounded-full border border-brand-ivory px-7 text-sm font-bold text-brand-ivory transition hover:bg-brand-ivory hover:text-brand-indigo">
                Custom Orders
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}