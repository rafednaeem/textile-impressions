"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const emptyForm = { name: "", slug: "", description: "", hero_image_url: "", season: "", year: "", is_published: false }

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function AdminCollectionsPage() {
  const supabase = createClient()
  const [collections, setCollections] = useState<any[]>([])
  const [form, setForm] = useState(emptyForm)

  const fetchCollections = async () => {
    const { data } = await supabase.from("collections").select("*").order("created_at", { ascending: false })
    if (data) setCollections(data)
  }

  useEffect(() => {
    fetchCollections()
  }, [])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    await supabase.from("collections").insert({
      ...form,
      description: form.description || null,
      hero_image_url: form.hero_image_url || null,
      season: form.season || null,
      year: form.year ? Number(form.year) : null,
    })
    setForm(emptyForm)
    fetchCollections()
  }

  const toggle = async (id: string, is_published: boolean) => {
    await supabase.from("collections").update({ is_published: !is_published }).eq("id", id)
    fetchCollections()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={save} className="space-y-3 rounded-lg border border-border bg-card p-5">
        <h1 className="font-heading text-2xl font-bold text-brand-forest">New Collection</h1>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} required placeholder="Name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required placeholder="Slug" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Description" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input value={form.hero_image_url} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} placeholder="Hero image URL" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} placeholder="Season" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="Year" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Published</label>
        <button className="rounded-full bg-brand-forest px-5 py-2 text-sm font-medium text-white">Create collection</button>
      </form>
      <div className="space-y-3">
        <h2 className="font-heading text-2xl font-bold text-brand-forest">Collections</h2>
        {collections.map((collection) => (
          <div key={collection.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
            <div>
              <p className="font-medium">{collection.name}</p>
              <p className="text-sm text-muted-foreground">{collection.season} {collection.year}</p>
            </div>
            <button onClick={() => toggle(collection.id, collection.is_published)} className="rounded-lg border border-border px-3 py-1 text-sm">
              {collection.is_published ? "Unpublish" : "Publish"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
