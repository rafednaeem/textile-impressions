"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { ChevronLeft, Loader2, ImagePlus, X } from "lucide-react"
import { WORKSHOP_FORMATS, WORKSHOP_LEVELS, WORKSHOP_STATUSES } from "@/lib/constants"

export default function EditWorkshopPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    short_description: "",
    instructor_name: "",
    cover_image_url: "",
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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/workshops/${id}`)
        if (!res.ok) throw new Error()
        const w = await res.json()
        setForm({
          title: w.title || "",
          description: w.description || "",
          short_description: w.short_description || "",
          instructor_name: w.instructor_name || "",
          cover_image_url: w.cover_image_url || "",
          format: w.format || "in_person",
          level: w.level || "all_levels",
          date_start: w.date_start ? new Date(w.date_start).toISOString().slice(0, 16) : "",
          date_end: w.date_end ? new Date(w.date_end).toISOString().slice(0, 16) : "",
          duration_minutes: w.duration_minutes ? String(w.duration_minutes) : "",
          location_address: w.location_address || "",
          online_meeting_platform: w.online_meeting_platform || "",
          online_meeting_url: w.online_meeting_url || "",
          max_seats: w.max_seats ? String(w.max_seats) : "",
          fee: String(w.fee ?? 0),
          materials_included: w.materials_included || false,
          materials_list: w.materials_list || "",
          status: w.status || "draft",
          is_featured: w.is_featured || false,
        })
      } catch {
        toast.error("Failed to load workshop")
        router.push("/admin/skills-studio")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "workshops")
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) set("cover_image_url", data.url)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/workshops/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date_start: form.date_start ? new Date(form.date_start).toISOString() : null,
          date_end: form.date_end ? new Date(form.date_end).toISOString() : null,
          duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
          max_seats: form.max_seats ? parseInt(form.max_seats) : null,
          fee: parseFloat(form.fee) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to update workshop")
        return
      }
      toast.success("Workshop updated")
      router.push("/admin/skills-studio")
    } catch {
      toast.error("Failed to update workshop")
    } finally {
      setSaving(false)
    }
  }

  const input = "block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
  const label = "block text-sm font-medium mb-1"

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/skills-studio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to Skills Studio
        </Link>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/skills-studio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Back to Skills Studio
      </Link>

      <h1 className="text-2xl font-bold">Edit Workshop</h1>
      <p className="mt-1 text-sm text-muted-foreground">Update workshop details.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold">Cover Image</h2>
          <div>
            {form.cover_image_url ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border">
                <Image src={form.cover_image_url} alt="Workshop cover" fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
                <button type="button" onClick={() => set("cover_image_url", "")} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 py-10 text-sm text-muted-foreground transition hover:border-brand-forest hover:text-brand-forest">
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
                <span>{uploading ? "Uploading..." : "Upload cover image"}</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </div>

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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}
