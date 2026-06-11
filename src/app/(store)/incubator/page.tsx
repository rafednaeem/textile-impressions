"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Hammer, LineChart, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Artisan } from "@/types/database"

const services = [
  { title: "Studio Access", description: "Shared textile studio space for sampling, finishing, photography, and small batch production.", icon: Hammer },
  { title: "Mentorship & Training", description: "Guidance on quality control, pricing, merchandising, product development, and business readiness.", icon: Users },
  { title: "Market Linkage", description: "Retail pathways through Textile Impressions, digital selling support, and buyer-facing storytelling.", icon: LineChart },
]

const steps = ["Apply", "Assessment", "Onboarding", "Grow"]

export default function IncubatorPage() {
  const supabase = createClient()
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.from("artisans").select("*").eq("is_featured", true).order("sort_order").limit(6).then(({ data }) => {
      if (data) setArtisans(data)
    })
  }, [supabase])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    const form = event.currentTarget
    const body = Object.fromEntries(new FormData(form))
    const res = await fetch("/api/incubator-enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSubmitting(false)
    if (res.ok) {
      form.reset()
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer")
    } else {
      alert(data.error || "Failed to submit enquiry")
    }
  }

  return (
    <div className="bg-brand-ivory text-brand-umber">
      <section className="px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">Textile Impression Incubator</p>
          <h1 className="mt-4 font-heading text-5xl font-semibold leading-tight text-brand-indigo sm:text-6xl">
            Pakistan&apos;s first textile cottage industry incubator
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            A fashion studio and support system for artisans, home-based makers, and small textile businesses ready to refine their craft and reach stronger markets.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 sm:px-6 md:grid-cols-3 lg:px-8">
        {services.map((service) => (
          <motion.div key={service.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-lg border border-border bg-white p-6">
            <service.icon className="h-7 w-7 text-brand-crimson" />
            <h2 className="mt-5 font-heading text-2xl font-semibold text-brand-indigo">{service.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.description}</p>
          </motion.div>
        ))}
      </section>

      <section className="bg-brand-indigo py-16 text-brand-ivory">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-4xl font-semibold">How it works</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-lg border border-brand-ivory/20 p-5">
                <span className="font-heading text-4xl text-brand-saffron">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-3 font-bold">{step}</p>
                {index < steps.length - 1 && <ArrowRight className="mt-4 hidden h-5 w-5 text-brand-ivory/50 md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {artisans.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-heading text-4xl font-semibold text-brand-indigo">Current cohort</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {artisans.map((artisan) => (
              <div key={artisan.id} className="overflow-hidden rounded-lg border border-border bg-white">
                <div className="relative aspect-[4/3]">
                  <Image src={artisan.image_url || `https://picsum.photos/seed/${artisan.id}/600/450`} alt={artisan.name} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 33vw" />
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-2xl font-semibold text-brand-indigo">{artisan.name}</h3>
                  <p className="text-sm text-muted-foreground">{artisan.craft} - {artisan.city}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <form onSubmit={submit} className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-3xl font-semibold text-brand-indigo">Apply for incubation</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <input name="name" required placeholder="Name" className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo" />
            <input name="phone" required placeholder="Phone" className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo" />
            <input name="craft_type" required placeholder="Craft type" className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo sm:col-span-2" />
            <textarea name="description" rows={5} placeholder="Brief description" className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo sm:col-span-2" />
          </div>
          <button disabled={submitting} className="mt-5 rounded-full bg-brand-saffron px-7 py-3 text-sm font-bold text-brand-umber disabled:opacity-60">
            {submitting ? "Submitting..." : "Submit enquiry"}
          </button>
        </form>
      </section>
    </div>
  )
}
