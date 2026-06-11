"use client"

import { useState } from "react"
import { Upload } from "lucide-react"

const garmentTypes = ["kurta", "suit", "dupatta", "other"]
const budgetRanges = ["Under PKR 10,000", "PKR 10,000 - 20,000", "PKR 20,000 - 40,000", "PKR 40,000+"]

export default function CustomOrdersPage() {
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    const form = event.currentTarget
    const res = await fetch("/api/custom-orders", {
      method: "POST",
      body: new FormData(form),
    })
    const data = await res.json()
    setSubmitting(false)
    if (res.ok) {
      form.reset()
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer")
    } else {
      alert(data.error || "Failed to submit custom order")
    }
  }

  return (
    <div className="bg-brand-ivory px-4 pb-20 pt-32 text-brand-umber sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">Custom studio</p>
          <h1 className="mt-4 font-heading text-5xl font-semibold text-brand-indigo">Commission a bespoke piece</h1>
          <p className="mt-4 text-muted-foreground">
            Share your fabric, fit, color, and deadline preferences. Our studio will review the request and continue the conversation on WhatsApp.
          </p>
        </div>

        <form onSubmit={submit} className="mt-10 rounded-lg border border-border bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <input name="name" required placeholder="Name" className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo" />
            <input name="phone" required placeholder="Phone" className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo" />
            <select name="garment_type" required className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo">
              <option value="">Garment type</option>
              {garmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <input name="fabric_preference" placeholder="Fabric preference" className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo" />
            <input name="color_preference" placeholder="Colour" className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo" />
            <input name="size" placeholder="Size" className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo" />
            <input name="quantity" type="number" min="1" defaultValue="1" placeholder="Quantity" className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo" />
            <select name="budget_range" className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo">
              <option value="">Budget range</option>
              {budgetRanges.map((range) => <option key={range} value={range}>{range}</option>)}
            </select>
            <input name="deadline" type="date" className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo" />
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-indigo/40 bg-background px-4 py-3 text-sm text-muted-foreground">
              <Upload className="h-4 w-4 text-brand-indigo" />
              Reference images
              <input name="reference_images" type="file" accept="image/*" multiple className="hidden" />
            </label>
            <textarea name="notes" rows={5} placeholder="Notes" className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo md:col-span-2" />
          </div>
          <button disabled={submitting} className="mt-5 rounded-full bg-brand-indigo px-7 py-3 text-sm font-bold text-brand-ivory disabled:opacity-60">
            {submitting ? "Submitting..." : "Send custom order request"}
          </button>
        </form>
      </div>
    </div>
  )
}
