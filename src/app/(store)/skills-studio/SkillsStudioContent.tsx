"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Calendar, Clock, MapPin, Monitor, Users, Filter, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Workshop } from "@/types/workshop"
import { WORKSHOP_FORMAT_LABELS, WORKSHOP_LEVEL_LABELS } from "@/lib/constants"

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 } as const,
  transition: { duration: 0.55 },
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString("en-PK", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function SkillsStudioContent() {
  const supabase = createClient()
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [filterFormat, setFilterFormat] = useState<string>("all")
  const [filterLevel, setFilterLevel] = useState<string>("all")

  useEffect(() => {
    const fetchWorkshops = async () => {
      const { data } = await supabase
        .from("workshops")
        .select("*")
        .eq("status", "published")
        .order("date_start", { ascending: true })

      if (data) setWorkshops(data as Workshop[])
      setLoading(false)
    }
    fetchWorkshops()
  }, [supabase])

  const filtered = workshops.filter((w) => {
    if (filterFormat !== "all" && w.format !== filterFormat) return false
    if (filterLevel !== "all" && w.level !== filterLevel) return false
    return true
  })

  const featured = filtered.filter((w) => w.is_featured)
  const upcoming = filtered.filter((w) => !w.is_featured && w.date_start && new Date(w.date_start) >= new Date())
  const past = filtered.filter((w) => !w.is_featured && w.date_start && new Date(w.date_start) < new Date())

  return (
    <div className="bg-brand-ivory">
      <section className="relative overflow-hidden bg-brand-indigo py-20 text-brand-ivory sm:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-saffron/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-brand-terracotta/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">Skills Studio</p>
            <h1 className="mt-4 font-heading text-4xl font-semibold sm:text-5xl lg:text-6xl">
              Learn. Create. Earn.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-brand-ivory/80">
              Professional textile craft training for everyone. From natural dyeing to block printing — build skills that create livelihoods.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filter:
          </div>
          <div className="relative">
            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="appearance-none rounded-full border border-border bg-background px-4 py-2 pr-8 text-sm font-medium transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-brand-forest"
            >
              <option value="all">All Formats</option>
              <option value="in_person">In Person</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="relative">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="appearance-none rounded-full border border-border bg-background px-4 py-2 pr-8 text-sm font-medium transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-brand-forest"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="all_levels">All Levels</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </section>

      {loading ? (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] rounded-xl bg-muted" />
                <div className="mt-3 space-y-2 px-1">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : filtered.length === 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-20 text-center sm:px-6 lg:px-8">
          <div className="rounded-full bg-muted p-4 mx-auto w-fit">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-heading text-xl font-bold text-brand-forest">No workshops found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or check back soon for new sessions.</p>
        </section>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
              <motion.div {...fadeUp}>
                <h2 className="font-heading text-2xl font-semibold text-brand-indigo">Featured Workshops</h2>
              </motion.div>
              <motion.div {...fadeUp} className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((workshop) => (
                  <WorkshopCard key={workshop.id} workshop={workshop} />
                ))}
              </motion.div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
              <motion.div {...fadeUp}>
                <h2 className="font-heading text-2xl font-semibold text-brand-indigo">Upcoming Sessions</h2>
              </motion.div>
              <motion.div {...fadeUp} className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((workshop) => (
                  <WorkshopCard key={workshop.id} workshop={workshop} />
                ))}
              </motion.div>
            </section>
          )}

          {past.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
              <motion.div {...fadeUp}>
                <h2 className="font-heading text-2xl font-semibold text-brand-indigo">Past Sessions</h2>
              </motion.div>
              <motion.div {...fadeUp} className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((workshop) => (
                  <WorkshopCard key={workshop.id} workshop={workshop} />
                ))}
              </motion.div>
            </section>
          )}
        </>
      )}

      <section className="bg-brand-indigo py-16 text-brand-ivory sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div {...fadeUp}>
            <h2 className="font-heading text-3xl font-semibold sm:text-4xl">Ready to start your craft journey?</h2>
            <p className="mt-4 text-lg text-brand-ivory/80">
              Our Skills Studio workshops are designed for beginners and professionals alike. Learn from master artisans and build skills that create real opportunities.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923XXXXXXXXX"}?text=${encodeURIComponent("Hi! I am interested in your Skills Studio workshops. Can you share more details?")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-full bg-brand-saffron px-7 text-sm font-bold text-brand-umber transition hover:bg-brand-saffron/90"
              >
                Ask on WhatsApp
              </a>
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center rounded-full border border-brand-ivory px-7 text-sm font-bold text-brand-ivory transition hover:bg-brand-ivory hover:text-brand-indigo"
              >
                Browse Products
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

function WorkshopCard({ workshop }: { workshop: Workshop }) {
  const isFree = workshop.fee === 0
  const spotsLeft = workshop.seats_remaining ?? null

  return (
    <Link href={`/skills-studio/${workshop.slug}`}>
      <motion.article
        whileHover={{ y: -4 }}
        className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-lg"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {workshop.cover_image_url ? (
            <Image
              src={workshop.cover_image_url}
              alt={workshop.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-brand-indigo/10">
              <Calendar className="h-12 w-12 text-brand-indigo/30" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <span className="rounded-full bg-brand-indigo/90 px-3 py-1 text-xs font-bold text-white">
              {WORKSHOP_FORMAT_LABELS[workshop.format] || workshop.format}
            </span>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-forest">
              {WORKSHOP_LEVEL_LABELS[workshop.level] || workshop.level}
            </span>
          </div>
          {isFree && (
            <span className="absolute right-3 top-3 rounded-full bg-brand-saffron px-3 py-1 text-xs font-bold text-brand-umber">
              Free
            </span>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-heading text-xl font-semibold text-brand-indigo group-hover:text-brand-terracotta transition-colors">
            {workshop.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {workshop.short_description || workshop.description?.slice(0, 120)}
          </p>

          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            {workshop.instructor_name && (
              <p className="font-medium text-brand-forest">Instructor: {workshop.instructor_name}</p>
            )}
            {workshop.date_start && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{formatDate(workshop.date_start)}</span>
              </div>
            )}
            {workshop.duration_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{workshop.duration_minutes} minutes</span>
              </div>
            )}
            {workshop.format === "in_person" && workshop.location_address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{workshop.location_address}</span>
              </div>
            )}
            {workshop.format !== "in_person" && (
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 shrink-0" />
                <span>{workshop.online_meeting_platform || "Online"}</span>
              </div>
            )}
            {spotsLeft !== null && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0" />
                <span>{spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-lg font-bold text-brand-forest">
              {isFree ? "Free" : `Rs. ${workshop.fee.toLocaleString()}`}
            </span>
            <span className="text-sm font-medium text-brand-terracotta group-hover:underline">
              View Details
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  )
}
