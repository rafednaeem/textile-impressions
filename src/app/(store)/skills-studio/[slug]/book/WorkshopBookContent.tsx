"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ChevronLeft, Loader2, Check, User, Mail, Phone } from "lucide-react"
import { motion } from "framer-motion"
import type { Workshop } from "@/types/workshop"
import { WORKSHOP_FORMAT_LABELS } from "@/lib/constants"
import { workshopRegisterSchema } from "@/lib/validations"

export default function WorkshopBookContent({ workshop }: { workshop: Workshop }) {
  const router = useRouter()
  const isFree = workshop.fee === 0
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = workshopRegisterSchema.safeParse({
      workshopId: workshop.id,
      guestName: form.name,
      guestEmail: form.email,
      guestPhone: form.phone || undefined,
    })
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

    try {
      const res = await fetch("/api/workshops/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId: workshop.id,
          guestName: form.name,
          guestEmail: form.email,
          guestPhone: form.phone || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Registration failed")
        setSubmitting(false)
        return
      }

      setSuccess(true)
      toast.success("Registration confirmed!")
    } catch {
      toast.error("Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-brand-ivory px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold text-brand-forest">You are registered!</h1>
          <p className="mt-2 text-muted-foreground">
            {isFree
              ? "Your spot has been confirmed. We will send you the meeting details closer to the date."
              : "Your registration is pending payment. Please complete the payment to confirm your spot."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            A confirmation has been sent to {form.email}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/skills-studio/${workshop.slug}`} className="rounded-full bg-brand-forest px-6 py-3 text-sm font-medium text-white hover:bg-brand-forest/90">
              Back to Workshop
            </Link>
            <Link href="/skills-studio" className="rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-muted">
              Browse More Workshops
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-brand-ivory px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href={`/skills-studio/${workshop.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-brand-forest mb-6">
          <ChevronLeft className="h-4 w-4" />
          Back to {workshop.title}
        </Link>

        <h1 className="font-heading text-2xl font-bold text-brand-forest">Register for this Workshop</h1>

        <div className="mt-4 rounded-xl border border-border bg-white p-4">
          <p className="font-medium text-brand-indigo">{workshop.title}</p>
          <p className="text-sm text-muted-foreground">
            {WORKSHOP_FORMAT_LABELS[workshop.format]} &middot; {isFree ? "Free" : `Rs. ${workshop.fee.toLocaleString()}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Full Name *</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.guestName) setErrors((p) => ({ ...p, guestName: "" })) }}
                className={`block w-full rounded-lg border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none ${errors.guestName ? "border-red-400 focus:border-red-500" : "border-border focus:border-brand-forest"}`}
                placeholder="Fatima Ahmed"
              />
            </div>
            {errors.guestName && <p className="mt-1 text-xs text-red-500">{errors.guestName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Email *</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.guestEmail) setErrors((p) => ({ ...p, guestEmail: "" })) }}
                className={`block w-full rounded-lg border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none ${errors.guestEmail ? "border-red-400 focus:border-red-500" : "border-border focus:border-brand-forest"}`}
                placeholder="fatima@example.com"
              />
            </div>
            {errors.guestEmail && <p className="mt-1 text-xs text-red-500">{errors.guestEmail}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Phone <span className="text-muted-foreground">(optional)</span></label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => { setForm({ ...form, phone: e.target.value }); if (errors.guestPhone) setErrors((p) => ({ ...p, guestPhone: "" })) }}
                className={`block w-full rounded-lg border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none ${errors.guestPhone ? "border-red-400 focus:border-red-500" : "border-border focus:border-brand-forest"}`}
                placeholder="03XXXXXXXXX"
              />
            </div>
            {errors.guestPhone && <p className="mt-1 text-xs text-red-500">{errors.guestPhone}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-forest px-6 py-3 text-sm font-medium text-white disabled:opacity-50 hover:bg-brand-forest/90"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Registering..." : isFree ? "Confirm Registration" : `Pay Rs. ${workshop.fee.toLocaleString()} & Register`}
          </button>
        </form>
      </div>
    </div>
  )
}