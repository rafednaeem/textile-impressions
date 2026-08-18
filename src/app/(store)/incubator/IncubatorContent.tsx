"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Hammer, LineChart, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Artisan } from "@/types/database"
import { incubatorEnquirySchema } from "@/lib/validations"
import { useFieldValidation } from "@/hooks/useFieldValidation"
import type { getPageWebsiteContent } from "@/lib/website-content/server"

const services = [
  { icon: Hammer },
  { icon: Users },
  { icon: LineChart },
]

export default function IncubatorContent({
  content,
}: {
  content: Awaited<ReturnType<typeof getPageWebsiteContent>>
}) {
  const c = content
  const supabase = createClient()
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    craft_type: "",
    description: "",
  })

  const validation = useFieldValidation(incubatorEnquirySchema, form)

  const serviceContent = [
    { title: c.services.service_1_title, description: c.services.service_1_description },
    { title: c.services.service_2_title, description: c.services.service_2_description },
    { title: c.services.service_3_title, description: c.services.service_3_description },
  ]

  const steps = c.how_it_works.steps.split(",").map((s) => s.trim())

  useEffect(() => {
    supabase.from("artisans").select("*").eq("is_featured", true).order("sort_order").limit(6).then(({ data }) => {
      if (data) setArtisans(data)
    })
  }, [supabase])

  const updateField = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
    validation.handleChange(name)
  }

  const getFieldBorder = (name: string) => {
    const error = errors[name] || validation.errors[name]
    if (error) return "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
    if (validation.getFieldState(name) === "valid" && form[name as keyof typeof form]) return "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
    return "border-border focus:border-brand-indigo"
  }

  const getErrorMessage = (name: string) => errors[name] || validation.errors[name]

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    validation.markAllTouched()
    const result = incubatorEnquirySchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    const res = await fetch("/api/incubator-enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)
    if (res.ok) {
      setForm({ name: "", email: "", phone: "", craft_type: "", description: "" })
      setErrors({})
      validation.clearErrors()
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer")
    } else {
      alert(data.error || "Failed to submit enquiry")
    }
  }

  return (
    <div className="bg-brand-ivory text-brand-umber">
      <section className="px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">{c.hero.label}</p>
          <h1 className="mt-4 font-heading text-5xl font-semibold leading-tight text-brand-indigo sm:text-6xl">
            {c.hero.heading}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            {c.hero.description}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 sm:px-6 md:grid-cols-3 lg:px-8">
        {services.map((service, index) => (
          <motion.div key={serviceContent[index].title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-lg border border-border bg-white p-6">
            <service.icon className="h-7 w-7 text-brand-crimson" />
            <h2 className="mt-5 font-heading text-2xl font-semibold text-brand-indigo">{serviceContent[index].title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{serviceContent[index].description}</p>
          </motion.div>
        ))}
      </section>

      <section className="bg-brand-indigo py-16 text-brand-ivory">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-4xl font-semibold">{c.how_it_works.heading}</h2>
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
          <h2 className="font-heading text-4xl font-semibold text-brand-indigo">{c.cohort.heading}</h2>
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
          <h2 className="font-heading text-3xl font-semibold text-brand-indigo">{c.form.heading}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <input
                name="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                onBlur={() => validation.handleBlur("name")}
                placeholder="Name"
                aria-invalid={!!getErrorMessage("name")}
                aria-describedby={getErrorMessage("name") ? "inc-name-error" : undefined}
                className={`rounded-lg border bg-background px-4 py-3 text-sm outline-none w-full transition-colors ${getFieldBorder("name")}`}
              />
              {getErrorMessage("name") && <p id="inc-name-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{getErrorMessage("name")}</p>}
            </div>
            <div>
              <input
                name="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                onBlur={() => validation.handleBlur("phone")}
                placeholder="Phone (03XXXXXXXXX)"
                aria-invalid={!!getErrorMessage("phone")}
                aria-describedby={getErrorMessage("phone") ? "inc-phone-error" : undefined}
                className={`rounded-lg border bg-background px-4 py-3 text-sm outline-none w-full transition-colors ${getFieldBorder("phone")}`}
              />
              {getErrorMessage("phone") && <p id="inc-phone-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{getErrorMessage("phone")}</p>}
            </div>
            <div className="sm:col-span-2">
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                onBlur={() => validation.handleBlur("email")}
                placeholder="Email"
                aria-invalid={!!getErrorMessage("email")}
                aria-describedby={getErrorMessage("email") ? "inc-email-error" : undefined}
                className={`rounded-lg border bg-background px-4 py-3 text-sm outline-none w-full transition-colors ${getFieldBorder("email")}`}
              />
              {getErrorMessage("email") && <p id="inc-email-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{getErrorMessage("email")}</p>}
            </div>
            <div className="sm:col-span-2">
              <input
                name="craft_type"
                value={form.craft_type}
                onChange={(e) => updateField("craft_type", e.target.value)}
                onBlur={() => validation.handleBlur("craft_type")}
                placeholder="Craft type"
                aria-invalid={!!getErrorMessage("craft_type")}
                aria-describedby={getErrorMessage("craft_type") ? "inc-craft-error" : undefined}
                className={`rounded-lg border bg-background px-4 py-3 text-sm outline-none w-full transition-colors ${getFieldBorder("craft_type")}`}
              />
              {getErrorMessage("craft_type") && <p id="inc-craft-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{getErrorMessage("craft_type")}</p>}
            </div>
            <textarea
              name="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={5}
              placeholder="Brief description"
              className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo transition-colors sm:col-span-2"
            />
          </div>
          <button disabled={submitting} className="mt-5 rounded-full bg-brand-saffron px-7 py-3 text-sm font-bold text-brand-umber disabled:opacity-60">
            {submitting ? "Submitting..." : c.form.submit_button}
          </button>
        </form>
      </section>
    </div>
  )
}
