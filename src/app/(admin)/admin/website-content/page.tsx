"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Loader2, Upload, X, ImageIcon, ChevronDown } from "lucide-react"
import {
  WEBSITE_CONTENT_PAGES,
  defaultWebsiteContent,
  type WebsiteContentPage,
} from "@/lib/website-content"
import type { WebsiteContent } from "@/types/database"

interface ContentMap {
  [page: string]: {
    [section: string]: {
      [field: string]: string
    }
  }
}

function buildMap(rows: WebsiteContent[]): ContentMap {
  const map: ContentMap = {}
  for (const row of rows) {
    if (!map[row.page]) map[row.page] = {}
    if (!map[row.page][row.section]) map[row.page][row.section] = {}
    map[row.page][row.section][row.field] = row.value
  }
  return map
}

function isTextAreaField(field: string): boolean {
  return /description|paragraph|body|text/.test(field)
}

function isImageField(field: string): boolean {
  return field === "image_url"
}

export default function WebsiteContentAdminPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState<WebsiteContent[]>([])
  const [selectedPage, setSelectedPage] = useState<WebsiteContentPage>("home")
  const [edits, setEdits] = useState<ContentMap>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/website-content")
      .then((res) => res.json())
      .then((res) => {
        const data: WebsiteContent[] = res.data ?? []
        setRows(data)
        setEdits(buildMap(data))
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load content")
        setLoading(false)
      })
  }, [])

  const pageSections = useMemo(() => {
    return defaultWebsiteContent[selectedPage]
  }, [selectedPage])

  const getValue = (section: string, field: string): string => {
    return edits[selectedPage]?.[section]?.[field] ?? defaultWebsiteContent[selectedPage][section][field]
  }

  const setValue = (section: string, field: string, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [selectedPage]: {
        ...prev[selectedPage],
        [section]: {
          ...prev[selectedPage]?.[section],
          [field]: value,
        },
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const updates: { page: string; section: string; field: string; value: string }[] = []

    for (const [page, sections] of Object.entries(edits)) {
      for (const [section, fields] of Object.entries(sections)) {
        for (const [field, value] of Object.entries(fields)) {
          const defaultValue = (defaultWebsiteContent as ContentMap)[page]?.[section]?.[field]
          // Only include values that differ from default or already exist in DB.
          const dbValue = rows.find((r) => r.page === page && r.section === section && r.field === field)?.value
          if (value !== defaultValue || dbValue !== undefined) {
            updates.push({ page, section, field, value })
          }
        }
      }
    }

    try {
      const res = await fetch("/api/admin/website-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")

      // Refresh rows so subsequent edits compare against DB.
      const refreshed = await fetch("/api/admin/website-content").then((r) => r.json())
      setRows(refreshed.data ?? [])
      setEdits(buildMap(refreshed.data ?? []))
      toast.success("Content saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save content")
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (section: string, field: string, file: File) => {
    if (!file) return
    setUploadingField(`${section}.${field}`)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/upload/website-image", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setValue(section, field, data.url)
      toast.success("Image uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image")
    } finally {
      setUploadingField(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="pb-20 lg:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Website Content</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit customer-facing text and About Us images.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-forest px-4 py-2 text-sm font-medium text-white hover:bg-brand-forest/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <label className="block text-sm font-medium">Page</label>
        <div className="relative mt-1">
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value as WebsiteContentPage)}
            className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
          >
            {WEBSITE_CONTENT_PAGES.map((page) => (
              <option key={page.id} value={page.id}>
                {page.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {Object.entries(pageSections).map(([section, fields]) => (
          <section key={section} className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold uppercase tracking-wide">
              {section.replace(/_/g, " ")}
            </h2>
            <div className="space-y-5">
              {Object.keys(fields).map((field) => {
                const label = field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                const value = getValue(section, field)

                if (isImageField(field)) {
                  return (
                    <div key={field}>
                      <label className="block text-sm font-medium">{label}</label>
                      <div className="mt-2">
                        {value ? (
                          <div className="relative inline-block overflow-hidden rounded-lg border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={value}
                              alt={label}
                              className="h-48 w-auto object-cover"
                            />
                            <button
                              onClick={() => setValue(section, field, "")}
                              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                              title="Remove image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-32 w-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="mt-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingField === `${section}.${field}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                          >
                            {uploadingField === `${section}.${field}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            {value ? "Replace Image" : "Upload Image"}
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(section, field, file)
                              e.target.value = ""
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={field}>
                    <label className="block text-sm font-medium">{label}</label>
                    {isTextAreaField(field) ? (
                      <textarea
                        value={value}
                        onChange={(e) => setValue(section, field, e.target.value)}
                        rows={4}
                        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(section, field, e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
