"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { ChevronLeft, Loader2, ImagePlus, X, Film, Play } from "lucide-react"
import { WORKSHOP_FORMATS, WORKSHOP_LEVELS, WORKSHOP_STATUSES } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import type { MediaType } from "@/lib/media"

interface VideoItem {
  url: string
  media_type: MediaType
  storage_path?: string
}

export default function NewWorkshopPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingVideos, setUploadingVideos] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [form, setForm] = useState({
    title: "",
    description: "",
    short_description: "",
    instructor_name: "Textile Impressions",
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

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }))

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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploadingVideos(true)
    for (const file of files) {
      try {
        const metaRes = await fetch("/api/admin/upload/workshop-media/signed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
            mediaType: "video",
          }),
        })

        const data = await metaRes.json()
        if (!metaRes.ok || !data.signedUrl) {
          toast.error(`Upload failed for ${file.name}`, {
            description: data.error || `Server returned ${metaRes.status}`,
          })
          continue
        }

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .uploadToSignedUrl(data.path, data.token, file)

        if (uploadError) {
          toast.error(`Upload failed for ${file.name}`, {
            description: uploadError.message || "Supabase upload failed",
          })
          continue
        }

        setVideos((prev) => [...prev, { url: data.url, media_type: data.media_type, storage_path: data.path }])
        toast.success("Video uploaded", { description: file.name })
      } catch (err) {
        toast.error(`Upload failed for ${file.name}`, {
          description: err instanceof Error ? err.message : "Unexpected error",
        })
      }
    }
    setUploadingVideos(false)
  }

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index))
  }

  const moveVideo = (index: number, direction: "up" | "down") => {
    setVideos((prev) => {
      const next = [...prev]
      const target = direction === "up" ? index - 1 : index + 1
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    setSaving(true)

    try {
      const res = await fetch("/api/admin/workshops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date_start: form.date_start ? new Date(form.date_start).toISOString() : null,
          date_end: form.date_end ? new Date(form.date_end).toISOString() : null,
          duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
          max_seats: form.max_seats ? parseInt(form.max_seats) : null,
          fee: parseFloat(form.fee) || 0,
          videos: videos.map((v) => ({
            url: v.url,
            storage_path: v.storage_path ?? null,
            alt_text: form.title.trim(),
            media_type: v.media_type,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to create workshop")
        return
      }

      toast.success("Workshop created")
      router.push("/admin/skills-studio")
    } catch {
      toast.error("Failed to create workshop")
    } finally {
      setSaving(false)
    }
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
          <h2 className="font-heading text-lg font-semibold">Workshop Videos</h2>
          <p className="text-sm text-muted-foreground">Short clips showing the work participants will do (MP4, WebM or MOV, max 50MB).</p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {videos.map((item, i) => (
              <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted">
                <video src={item.url} preload="metadata" className="h-full w-full object-cover" muted playsInline />

                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-brand-forest px-1.5 py-0.5 text-[10px] text-white">Primary</span>
                )}

                <span className="absolute right-1 top-1 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                  <Film className="h-3 w-3" /> Video
                </span>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <Play className="h-8 w-8 text-white/80 drop-shadow-md" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                  <button type="button" onClick={() => moveVideo(i, "up")} disabled={i === 0} className="rounded bg-white p-1 disabled:opacity-30">
                    <ChevronLeft className="h-3 w-3 text-brand-forest" />
                  </button>
                  <button type="button" onClick={() => moveVideo(i, "down")} disabled={i === videos.length - 1} className="rotate-180 rounded bg-white p-1 disabled:opacity-30">
                    <ChevronLeft className="h-3 w-3 text-brand-forest" />
                  </button>
                  <button type="button" onClick={() => removeVideo(i)} className="rounded bg-white p-1">
                    <X className="h-3 w-3 text-red-500" />
                  </button>
                </div>
              </div>
            ))}

            <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-brand-forest">
              {uploadingVideos ? (
                <Loader2 className="h-5 w-5 animate-spin text-brand-forest" />
              ) : (
                <>
                  <Film className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload Videos</span>
                </>
              )}
              <input type="file" accept="video/mp4,video/webm,video/quicktime" multiple className="hidden" onChange={handleVideoUpload} disabled={uploadingVideos} />
            </label>
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
            {saving ? "Creating..." : "Create Workshop"}
          </button>
        </div>
      </form>
    </div>
  )
}
