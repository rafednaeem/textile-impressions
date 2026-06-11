"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const emptyForm = { name: "", craft: "", city: "", region: "", bio: "", image_url: "", is_featured: true, sort_order: 0 }

export default function AdminArtisansPage() {
  const supabase = createClient()
  const [artisans, setArtisans] = useState<any[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchArtisans = async () => {
    const { data } = await supabase.from("artisans").select("*").order("sort_order")
    if (data) setArtisans(data)
  }

  useEffect(() => {
    fetchArtisans()
  }, [])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const payload = { ...form, region: form.region || null, image_url: form.image_url || null }
    if (editingId) {
      await supabase.from("artisans").update(payload).eq("id", editingId)
    } else {
      await supabase.from("artisans").insert(payload)
    }
    setForm(emptyForm)
    setEditingId(null)
    fetchArtisans()
  }

  const edit = (artisan: any) => {
    setEditingId(artisan.id)
    setForm({
      name: artisan.name,
      craft: artisan.craft,
      city: artisan.city,
      region: artisan.region || "",
      bio: artisan.bio,
      image_url: artisan.image_url || "",
      is_featured: artisan.is_featured,
      sort_order: artisan.sort_order,
    })
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this artisan profile?")) return
    await supabase.from("artisans").delete().eq("id", id)
    fetchArtisans()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={save} className="space-y-3 rounded-lg border border-border bg-card p-5">
        <h1 className="font-heading text-2xl font-bold text-brand-forest">{editingId ? "Edit Artisan" : "New Artisan"}</h1>
        {["name", "craft", "city", "region", "image_url"].map((field) => (
          <input key={field} value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={field.replace("_", " ")} required={["name", "craft", "city"].includes(field)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        ))}
        <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} required rows={5} placeholder="Bio" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} placeholder="Sort order" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured</label>
        <button className="rounded-full bg-brand-forest px-5 py-2 text-sm font-medium text-white">Save artisan</button>
      </form>
      <div className="space-y-3">
        <h2 className="font-heading text-2xl font-bold text-brand-forest">Artisans</h2>
        {artisans.map((artisan) => (
          <div key={artisan.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
            <div>
              <p className="font-medium">{artisan.name}</p>
              <p className="text-sm text-muted-foreground">{artisan.craft} - {artisan.city}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => edit(artisan)} className="rounded-lg border border-border px-3 py-1 text-sm">Edit</button>
              <button onClick={() => remove(artisan.id)} className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
