"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, Loader2, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const emptyForm = { name: "", slug: "", description: "", hero_image_url: "", season: "", year: "", is_published: false }

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function AdminCollectionsPage() {
  const supabase = createClient()
  const [collections, setCollections] = useState<any[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchCollections = async () => {
    const { data } = await supabase.from("collections").select("*").order("created_at", { ascending: false })
    if (data) setCollections(data)
  }

  useEffect(() => {
    fetchCollections()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "collections")
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) setForm((prev) => ({ ...prev, hero_image_url: data.url }))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeImage = () => setForm((prev) => ({ ...prev, hero_image_url: "" }))

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      hero_image_url: form.hero_image_url || null,
      season: form.season || null,
      year: form.year ? Number(form.year) : null,
      is_published: form.is_published,
    }
    if (editingId) {
      await supabase.from("collections").update(payload).eq("id", editingId)
    } else {
      await supabase.from("collections").insert(payload)
    }
    setForm(emptyForm)
    setEditingId(null)
    fetchCollections()
  }

  const edit = (collection: any) => {
    setEditingId(collection.id)
    setForm({
      name: collection.name,
      slug: collection.slug,
      description: collection.description || "",
      hero_image_url: collection.hero_image_url || "",
      season: collection.season || "",
      year: collection.year ? String(collection.year) : "",
      is_published: collection.is_published,
    })
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this collection?")) return
    await supabase.from("collections").delete().eq("id", id)
    fetchCollections()
  }

  const toggle = async (id: string, is_published: boolean) => {
    await supabase.from("collections").update({ is_published: !is_published }).eq("id", id)
    fetchCollections()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={save} className="space-y-3 rounded-lg border border-border bg-card p-5">
        <h1 className="font-heading text-2xl font-bold text-brand-forest">{editingId ? "Edit Collection" : "New Collection"}</h1>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Hero Image</label>
          {form.hero_image_url ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border">
              <Image src={form.hero_image_url} alt="Collection hero" fill className="object-cover" sizes="380px" />
              <button type="button" onClick={removeImage} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 py-10 text-sm text-muted-foreground transition hover:border-brand-forest hover:text-brand-forest">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
              <span>{uploading ? "Uploading..." : "Upload hero image"}</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} required placeholder="Name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required placeholder="Slug" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Description" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} placeholder="Season" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="Year" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Published</label>
        <div className="flex gap-2">
          <button className="rounded-full bg-brand-forest px-5 py-2 text-sm font-medium text-white">{editingId ? "Update collection" : "Create collection"}</button>
          {editingId && (
            <button type="button" onClick={() => { setForm(emptyForm); setEditingId(null) }} className="rounded-full border border-border px-5 py-2 text-sm font-medium">Cancel</button>
          )}
        </div>
      </form>
      <div className="space-y-3">
        <h2 className="font-heading text-2xl font-bold text-brand-forest">Collections</h2>
        {collections.map((collection) => (
          <div key={collection.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              {collection.hero_image_url && (
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                  <Image src={collection.hero_image_url} alt={collection.name} fill className="object-cover" sizes="80px" />
                </div>
              )}
              <div>
                <p className="font-medium">{collection.name}</p>
                <p className="text-sm text-muted-foreground">{collection.season} {collection.year}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggle(collection.id, collection.is_published)} className="rounded-lg border border-border px-3 py-1 text-sm">
                {collection.is_published ? "Unpublish" : "Publish"}
              </button>
              <button onClick={() => edit(collection)} className="rounded-lg border border-border px-3 py-1 text-sm">Edit</button>
              <button onClick={() => remove(collection.id)} className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
