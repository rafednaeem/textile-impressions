"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { customOrderSchema } from "@/lib/validations"
import { useFieldValidation } from "@/hooks/useFieldValidation"

const garmentTypes = ["kurta", "suit", "dupatta", "other"]
const budgetRanges = ["Under PKR 10,000", "PKR 10,000 - 20,000", "PKR 20,000 - 40,000", "PKR 40,000+"]

export default function CustomOrdersPage() {
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: "",
    phone: "",
    garment_type: "",
    fabric_preference: "",
    color_preference: "",
    size: "",
    quantity: "1",
    budget_range: "",
    deadline: "",
    notes: "",
  })

  const validation = useFieldValidation(customOrderSchema, form)

  const updateField = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
    validation.handleChange(name)
  }

  const getFieldBorder = (name: string) => {
    const realtimeError = validation.errors[name]
    const submitError = errors[name]
    const error = submitError || realtimeError
    if (error) return "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
    if (validation.getFieldState(name) === "valid" && form[name as keyof typeof form]) return "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
    return "border-border focus:border-brand-indigo"
  }

  const getErrorMessage = (name: string) => errors[name] || validation.errors[name]

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    validation.markAllTouched()
    const result = customOrderSchema.safeParse(form)
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

    const fd = new FormData()
    for (const [key, val] of Object.entries(form)) {
      fd.set(key, val)
    }

    const res = await fetch("/api/custom-orders", {
      method: "POST",
      body: fd,
    })
    const data = await res.json()
    setSubmitting(false)
    if (res.ok) {
      setForm({ name: "", phone: "", garment_type: "", fabric_preference: "", color_preference: "", size: "", quantity: "1", budget_range: "", deadline: "", notes: "" })
      setErrors({})
      validation.clearErrors()
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
            <div>
              <input
                name="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                onBlur={() => validation.handleBlur("name")}
                placeholder="Name"
                aria-invalid={!!getErrorMessage("name")}
                aria-describedby={getErrorMessage("name") ? "custom-name-error" : undefined}
                className={`rounded-lg border bg-background px-4 py-3 text-sm outline-none w-full transition-colors ${getFieldBorder("name")}`}
              />
              {getErrorMessage("name") && <p id="custom-name-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{getErrorMessage("name")}</p>}
            </div>
            <div>
              <input
                name="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                onBlur={() => validation.handleBlur("phone")}
                placeholder="Phone"
                aria-invalid={!!getErrorMessage("phone")}
                aria-describedby={getErrorMessage("phone") ? "custom-phone-error" : undefined}
                className={`rounded-lg border bg-background px-4 py-3 text-sm outline-none w-full transition-colors ${getFieldBorder("phone")}`}
              />
              {getErrorMessage("phone") && <p id="custom-phone-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{getErrorMessage("phone")}</p>}
            </div>
            <div>
              <select
                name="garment_type"
                value={form.garment_type}
                onChange={(e) => updateField("garment_type", e.target.value)}
                onBlur={() => validation.handleBlur("garment_type")}
                aria-invalid={!!getErrorMessage("garment_type")}
                aria-describedby={getErrorMessage("garment_type") ? "custom-garment-error" : undefined}
                className={`rounded-lg border bg-background px-4 py-3 text-sm outline-none w-full transition-colors ${getFieldBorder("garment_type")}`}
              >
                <option value="">Garment type</option>
                {garmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              {getErrorMessage("garment_type") && <p id="custom-garment-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{getErrorMessage("garment_type")}</p>}
            </div>
            <input
              name="fabric_preference"
              value={form.fabric_preference}
              onChange={(e) => updateField("fabric_preference", e.target.value)}
              placeholder="Fabric preference"
              className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo transition-colors"
            />
            <input
              name="color_preference"
              value={form.color_preference}
              onChange={(e) => updateField("color_preference", e.target.value)}
              placeholder="Colour"
              className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo transition-colors"
            />
            <input
              name="size"
              value={form.size}
              onChange={(e) => updateField("size", e.target.value)}
              placeholder="Size"
              className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo transition-colors"
            />
            <input
              name="quantity"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              placeholder="Quantity"
              className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo transition-colors"
            />
            <select
              name="budget_range"
              value={form.budget_range}
              onChange={(e) => updateField("budget_range", e.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo transition-colors"
            >
              <option value="">Budget range</option>
              {budgetRanges.map((range) => <option key={range} value={range}>{range}</option>)}
            </select>
            <input
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => updateField("deadline", e.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo transition-colors"
            />
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-indigo/40 bg-background px-4 py-3 text-sm text-muted-foreground">
              <Upload className="h-4 w-4 text-brand-indigo" />
              Reference images
              <input name="reference_images" type="file" accept="image/*" multiple className="hidden" />
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={5}
              placeholder="Notes"
              className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand-indigo transition-colors md:col-span-2"
            />
          </div>
          <button disabled={submitting} className="mt-5 rounded-full bg-brand-indigo px-7 py-3 text-sm font-bold text-brand-ivory disabled:opacity-60">
            {submitting ? "Submitting..." : "Send custom order request"}
          </button>
        </form>
      </div>
    </div>
  )
}
