"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Artisan, Product } from "@/types/database"
import ProductCard from "@/components/store/ProductCard"
import ImpactCounters from "@/components/store/ImpactCounters"

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.55 },
}

const fallbackArtisans: Artisan[] = [
  {
    id: "fatima-bibi",
    name: "Fatima Bibi",
    craft: "Block Printing",
    city: "Multan",
    region: "Punjab",
    bio: "Fatima Bibi learned block printing in her family courtyard and now trains younger makers in careful motif registration, natural dye handling, and finishing details for contemporary garments.",
    image_url: "https://picsum.photos/seed/fatima-artisan/600/760",
    is_featured: true,
    sort_order: 1,
    created_at: "",
  },
  {
    id: "zainab-khatoon",
    name: "Zainab Khatoon",
    craft: "Ajrak Dyeing",
    city: "Hyderabad",
    region: "Sindh",
    bio: "Zainab Khatoon works with Ajrak-inspired resist dyeing, balancing indigo-rich tradition with lighter silhouettes suited for everyday Pakistani fashion.",
    image_url: "https://picsum.photos/seed/zainab-artisan/600/760",
    is_featured: true,
    sort_order: 2,
    created_at: "",
  },
  {
    id: "rehana-begum",
    name: "Rehana Begum",
    craft: "Hand Embroidery",
    city: "Lahore",
    region: "Punjab",
    bio: "Rehana Begum specializes in delicate hand embroidery, turning threadwork into quiet statement pieces while mentoring home-based women artisans.",
    image_url: "https://picsum.photos/seed/rehana-artisan/600/760",
    is_featured: true,
    sort_order: 3,
    created_at: "",
  },
]

const fallbackUgc: { id: string; customer_name: string; image_url: string }[] = []

function YarnBallIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M12 24c0-7 5.5-12 12-12s12 5 12 12-5 12-12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M24 10v28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 24h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 15l18 18M15 33l18-18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M35 35c3 3 5 7 5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function HeroWordmark() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="flex flex-col items-center text-brand-indigo"
    >
      <span className="sr-only">
        Textile Impression — Education, Sampling & Production
      </span>
      <div aria-hidden className="flex flex-col items-center">
        <span className="font-sans text-[10px] font-medium uppercase tracking-[0.45em] sm:text-xs md:text-sm">
          Textile
        </span>
        <div className="flex items-center gap-1 font-sans text-2xl font-light uppercase tracking-[0.18em] sm:text-3xl md:text-4xl lg:text-5xl">
          <span>IMPRESS</span>
          <YarnBallIcon className="-mx-0.5 h-6 w-6 sm:h-7 sm:w-7 md:h-9 md:w-9 lg:h-11 lg:w-11" />
          <span>N</span>
        </div>
      </div>
      <span className="mt-2 font-sans text-[9px] font-medium uppercase tracking-[0.25em] text-brand-indigo/80 sm:text-[10px] md:text-xs">
        Education, Sampling & Production
      </span>
    </motion.div>
  )
}

export default function HomeContent() {
  const supabase = createClient()
  const [featured, setFeatured] = useState<Product[]>([])
  const [artisans, setArtisans] = useState<Artisan[]>(fallbackArtisans)
  const [ugcPhotos, setUgcPhotos] = useState(fallbackUgc)
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null)
  const [whatsappNumber, setWhatsappNumber] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, artisanRes, ugcRes] = await Promise.all([
        supabase.from("products").select("*, product_images(*)").eq("is_active", true).eq("is_featured", true).limit(8),
        supabase.from("artisans").select("*").eq("is_featured", true).order("sort_order").limit(3),
        supabase.from("ugc_photos").select("*").eq("is_approved", true).order("created_at", { ascending: false }).limit(6),
      ])
      if (prodRes.data) setFeatured(prodRes.data)
      if (artisanRes.data?.length) setArtisans(artisanRes.data)
      if (ugcRes.data?.length) setUgcPhotos(ugcRes.data)
    }
    fetchData()
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "store_whatsapp")
      .single()
      .then(({ data }) => {
        if (data?.value) setWhatsappNumber(data.value)
      })
  }, [supabase])

  const shareHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi! I'd like to share my Textile Impression look. [Customer sends photo directly]")}`

  return (
    <div className="bg-white text-brand-indigo">
      <section className="relative flex h-[100svh] min-h-[640px] flex-col overflow-hidden bg-white sm:min-h-[700px] md:min-h-[760px]">
        {/* Top-right decorative ink swirl */}
        <div className="pointer-events-none absolute top-0 right-0 z-0 h-[70%] w-[60%] overflow-hidden md:h-[65%] md:w-[50%] lg:w-[45%]">
          <Image
            src="/new_hero.jpeg"
            alt=""
            fill
            preload
            sizes="(max-width: 768px) 60vw, 50vw"
            className="object-contain"
            style={{ objectPosition: "top right" }}
          />
        </div>

        {/* Bottom-left decorative ink swirl */}
        <div className="pointer-events-none absolute bottom-0 left-0 z-0 h-[70%] w-[60%] overflow-hidden md:h-[65%] md:w-[50%] lg:w-[45%]">
          <Image
            src="/new_hero.jpeg"
            alt=""
            fill
            preload
            sizes="(max-width: 768px) 60vw, 50vw"
            className="scale-x-[-1] object-contain"
            style={{ objectPosition: "bottom left" }}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-lg md:max-w-xl"
          >
            <h1 className="font-heading text-[clamp(2.6rem,7vw,4.5rem)] font-semibold leading-[1.05] text-brand-indigo">
              From Craft
              <br /> to Career
            </h1>
            <p className="mt-4 max-w-md font-heading text-base italic leading-relaxed text-brand-indigo/85 sm:text-lg">
              Handcrafted Pakistani textiles, artisan-led skills training, sustainable livelihoods
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center rounded-full bg-brand-saffron px-8 text-sm font-semibold text-white transition hover:bg-brand-saffron/90 sm:text-base"
              >
                Shop the collection
              </Link>
              <Link
                href="/skills-studio"
                className="inline-flex h-12 items-center justify-center rounded-full border border-brand-indigo bg-white px-8 text-sm font-semibold text-brand-indigo transition hover:bg-brand-indigo hover:text-white sm:text-base"
              >
                Learn a craft
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Centered wordmark at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10 flex flex-col items-center px-4 pb-16 sm:pb-20"
        >
          <HeroWordmark />
        </motion.div>

        <ChevronDown className="absolute bottom-5 left-1/2 z-10 h-6 w-6 -translate-x-1/2 animate-bounce text-brand-indigo/60 sm:bottom-6 sm:h-7 sm:w-7" />
      </section>

      <section aria-hidden className="h-10 overflow-hidden bg-brand-ivory">
        <svg className="h-10 w-full" preserveAspectRatio="none" viewBox="0 0 400 40">
          <defs>
            <pattern id="block-print" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 20H40M20 0V40M6 6h12v12H6zM22 22h12v12H22z" fill="none" stroke="#D4891A" strokeOpacity="0.2" strokeWidth="2" />
              <circle cx="20" cy="20" r="4" fill="#D4891A" fillOpacity="0.2" />
            </pattern>
          </defs>
          <rect width="400" height="40" fill="url(#block-print)" />
        </svg>
      </section>

      <section className="bg-brand-indigo py-4 text-brand-ivory">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 text-center font-heading text-sm font-semibold uppercase tracking-[0.18em] sm:px-6 lg:px-8">
          <span>Handcrafted</span>
          <span>Natural Dyes</span>
          <span>Skills Training</span>
          <span>Sustainable Livelihoods</span>
          <span>Ships Nationwide</span>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-4xl font-semibold text-brand-indigo">Featured products</h2>
                <p className="mt-2 text-sm text-muted-foreground">Handpicked pieces from our studio floor.</p>
              </div>
              <Link href="/shop" className="text-sm font-bold text-brand-crimson hover:text-brand-indigo">View all products</Link>
            </motion.div>
            <motion.div {...fadeUp} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mb-8">
            <h2 className="font-heading text-4xl font-semibold text-brand-indigo">The hands behind the craft</h2>
          </motion.div>
          <motion.div {...fadeUp} className="grid gap-5 md:grid-cols-3">
            {artisans.map((artisan) => (
              <button key={artisan.id} onClick={() => setSelectedArtisan(artisan)} className="group overflow-hidden rounded-lg border border-border bg-brand-ivory text-left transition hover:-translate-y-1 hover:shadow-lg">
                <div className="relative aspect-[4/5]">
                  <Image src={artisan.image_url || `https://picsum.photos/seed/${artisan.id}/600/760`} alt={artisan.name} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-2xl font-semibold text-brand-indigo">{artisan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{artisan.craft} - {artisan.city}</p>
                </div>
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-brand-indigo py-16 text-brand-ivory sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <motion.div {...fadeUp}>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-saffron">Our Impact</p>
            <h2 className="mt-3 max-w-2xl font-heading text-4xl font-semibold sm:text-5xl">
              Empowering cottage artisans since 2018
            </h2>
          </motion.div>
          <motion.div {...fadeUp}>
            <ImpactCounters />
          </motion.div>
        </div>
      </section>

      <section className="bg-brand-indigo/10 py-16 text-brand-forest sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <motion.div {...fadeUp}>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-terracotta">Incubator</p>
            <h2 className="mt-3 max-w-2xl font-heading text-4xl font-semibold sm:text-5xl">
              Where craft becomes enterprise
            </h2>
            <p className="mt-4 max-w-xl text-brand-forest/80">
              For artisans, graduates, and designers ready to turn textile skill into a sustainable business.
              We provide studio access, practical mentoring, and connections to buyers.
            </p>
          </motion.div>
          <motion.div {...fadeUp} className="space-y-5">
            <ul className="space-y-3 text-lg">
              {["Studio Access", "Mentorship & Counselling", "Market Linkage"].map((item) => (
                <li key={item} className="border-b border-brand-forest/15 pb-3">{item}</li>
              ))}
            </ul>
            <Link href="/incubator" className="inline-flex rounded-full bg-brand-saffron px-6 py-3 text-sm font-bold text-brand-umber transition hover:bg-brand-saffron/90">
              Learn about our incubator -&gt;
            </Link>
          </motion.div>
        </div>
      </section>

      {ugcPhotos.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-heading text-4xl font-semibold text-brand-indigo">As worn by our customers</h2>
              <a href={shareHref} target="_blank" rel="noreferrer" className="rounded-full border border-brand-indigo px-5 py-2 text-sm font-bold text-brand-indigo transition hover:bg-brand-indigo hover:text-brand-ivory">
                Share your look
              </a>
            </motion.div>
            <motion.div {...fadeUp} className="columns-2 gap-3 md:columns-3 lg:columns-6">
              {ugcPhotos.map((photo) => (
                <div key={photo.id} className="mb-3 break-inside-avoid overflow-hidden rounded-lg bg-muted">
                  <Image src={photo.image_url} alt={photo.customer_name} width={500} height={700} className="h-auto w-full object-cover" sizes="(max-width: 768px) 50vw, 16vw" />
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      <AnimatePresence>
        {selectedArtisan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-brand-umber/70 p-4" onClick={() => setSelectedArtisan(null)}>
            <motion.div initial={{ y: 24, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 24, scale: 0.98 }} className="relative max-w-lg rounded-lg bg-brand-ivory p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <button onClick={() => setSelectedArtisan(null)} className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label="Close artisan bio">
                <X className="h-5 w-5" />
              </button>
              <h3 className="pr-8 font-heading text-3xl font-semibold text-brand-indigo">{selectedArtisan.name}</h3>
              <p className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-brand-crimson">{selectedArtisan.craft} - {selectedArtisan.city}</p>
              <p className="mt-5 leading-7 text-brand-umber/80">{selectedArtisan.bio}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
