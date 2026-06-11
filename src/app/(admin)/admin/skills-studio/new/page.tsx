"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ChevronLeft, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { WORKSHOP_FORMATS, WORKSHOP_LEVELS, WORKSHOP_STATUSES } from "@/lib/constants"

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export default function NewWorkshopPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    short_description: "",
    instructor_name: "Textile Impressions",
    format: "in_person" as string,
    level: "all_levels" as string,
    date_start: "",
    date_end: "",
    duration_minutes: "",
    location_address: "",
    online_meeting_platform: "",
    online_meeting_url: "",
    max_seats: "",
    fee: "0",
    materials_included: false,
    materials_list: "",
    status: "draft" as string,
    is_featured: false,
  })

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    setSaving(true)

    const slug = slugify(form.title)
    const { error } = await supabase.from("workshops").insert({
      title: form.title.trim(),
      slug,
      description: form.description || null,
      short_description: form.short_description || null,
      instructor_name: form.instructor_name,
      format: form.format,
      level: form.level,
      date_start: form.date_start ? new Date(form.date_start).toISOString() : null,
      date_end: form.date_end ? new Date(form.date_end).toISOString() : null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      location_address: form.location_address || null,
      online_meeting_platform: form.online_meeting_platform || null,
      online_meeting_url: form.online_meeting_url || null,
      max_seats: form.max_seats ? parseInt(form.max_seats) : null,
      seats_remaining: form.max_seats ? parseInt(form.max_seats) : null,
      fee: parseFloat(form.fee) || 0,
      materials_included: form.materials_included,
      materials_list: form.materials_list || null,
      status: form.status,
      is_featured: form.is_featured,
    })

    setSaving(false)

    if (error) {
      toast.error(error.message || "Failed to create workshop")
      return
    }

    toast.success("Workshop created")
    router.push("/admin/skills-studio")
  }

  const input = "block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
  const label = "block text-sm font-medium mb-1"

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/skills-studio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Back to Skills Studio
      </Link>

      <h1 className="text-2xl font-bold">New Workshop</h1>
      <p className="mt-1 text-sm text-muted-foreground">Create a new workshop or training session.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold">Basic Info</h2>

          <div>
            <label className={label}>Title *</label>
            <input required value={form.title} onChange={(e) => set("title", e.target.value)} className={input} placeholder="e.g. Natural Dyeing Workshop" />
          </div>

          <div>
            <label className={label}>Short Description</label>
            <input value={form.short_description} onChange={(e) => set("short_description", e.target.value)} className={input} placeholder="One-line summary for cards" />
          </div>

          <div>
            <label className={label}>Full Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} className={input} placeholder="Detailed description of the workshop..." />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Instructor</label>
              <input value={form.instructor_name} onChange={(e) => set("instructor_name", e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={input}>
                {WORKSHOP_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold">Schedule & Location</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Format</label>
              <select value={form.format} onChange={(e) => set("format", e.target.value)} className={input}>
                {WORKSHOP_FORMATS.map((f) => <option key={f} value={f}>{f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Level</label>
              <select value={form.level} onChange={(e) => set("level", e.target.value)} className={input}>
                {WORKSHOP_LEVELS.map((l) => <option key={l} value={l}>{l.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Start Date & Time</label>
              <input type="datetime-local" value={form.date_start} onChange={(e) => set("date_start", e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>End Date & Time</label>
              <input type="datetime-local" value={form.date_end} onChange={(e) => set("date_end", e.target.value)} className={input} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Duration (minutes)</label>
              <input type="number" value={form.duration_minutes} onChange={(e) => set("duration_minutes", e.target.value)} className={input} placeholder="120" />
            </div>
            <div>
              <label className={label}>Max Seats</label>
              <input type="number" value={form.max_seats} onChange={(e) => set("max_seats", e.target.value)} className={input} placeholder="20" />
            </div>
          </div>

          {(form.format === "in_person" || form.format === "hybrid") && (
            <div>
              <label className={label}>Location Address</label>
              <input value={form.location_address} onChange={(e) => set("location_address", e.target.value)} className={input} placeholder="Studio address, Lahore" />
            </div>
          )}

          {(form.format === "online" || form.format === "hybrid") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Meeting Platform</label>
                <select value={form.online_meeting_platform} onChange={(e) => set("online_meeting_platform", e.target.value)} className={input}>
                  <option value="">Select</option>
                  <option value="zoom">Zoom</option>
                  <option value="google_meet">Google Meet</option>
                  <option value="teams">Teams</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={label}>Meeting URL</label>
                <input value={form.online_meeting_url} onChange={(e) => set("online_meeting_url", e.target.value)} className={input} placeholder="https://..." />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold">Pricing & Materials</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Fee (Rs.)</label>
              <input type="number" step="0.01" value={form.fee} onChange={(e) => set("fee", e.target.value)} className={input} />
              <p className="mt-1 text-xs text-muted-foreground">Set to 0 for free workshops</p>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.materials_included} onChange={(e) => set("materials_included", e.target.checked)} className="rounded border-border" />
                Materials included in fee
              </label>
            </div>
          </div>

          {form.materials_included && (
            <div>
              <label className={label}>Materials List</label>
              <textarea value={form.materials_list} onChange={(e) => set("materials_list", e.target.value)} rows={3} className={input} placeholder="List of materials provided..." />
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="rounded border-border" />
              Featured on Skills Studio page
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/admin/skills-studio" className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-brand-forest px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-forest/90 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Creating..." : "Create Workshop"}
          </button>
        </div>
      </form>
    </div>
  )
}