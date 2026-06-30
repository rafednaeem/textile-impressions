"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Upload, X, GripVertical } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
const CRAFT_TYPES = ["Block Print", "Ajrak", "Hand Embroidered", "Chunri", "Plain"]

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: "", slug: "", description: "", short_description: "", price: "",
    sale_price: "", inventory_count: "0",
    category_id: "", is_featured: false, is_active: true,
    tags: "", craft_type: "Plain", fabric: "", care_instructions: "",
    sizes: [] as string[], colors: [] as { name: string; hex: string }[],
  })

  const [images, setImages] = useState<{ url: string; id?: string; alt_text?: string }[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data: product } = await supabase
        .from("products")
        .select("*, product_images(*), product_variants(*)")
        .eq("id", id)
        .single()

      if (product) {
        setForm({
          name: product.name,
          slug: product.slug,
          description: product.description || "",
          short_description: product.short_description || "",
          price: product.price.toString(),
          sale_price: product.sale_price?.toString() || "",
          inventory_count: product.inventory_count.toString(),
          category_id: product.category_id || "",
          is_featured: product.is_featured,
          is_active: product.is_active,
          tags: (product.tags || []).join(", "),
          craft_type: product.craft_type || "Plain",
          fabric: product.fabric || "",
          care_instructions: product.care_instructions || "",
          sizes: Array.from(new Set((product.product_variants || []).map((v: any) => v.size).filter(Boolean))) as string[],
          colors: (Array.from(new Set((product.product_variants || []).map((v: any) => v.color).filter(Boolean))) as string[]).map((c) => ({ name: c, hex: "#c1623d" })),
        })
        setImages(
          (product.product_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((img: any) => ({
            url: img.url,
            id: img.id,
            alt_text: img.alt_text,
          }))
        )
      }

      const { data: cats } = await supabase.from("categories").select("*").order("name")
      if (cats) setCategories(cats)

      setLoading(false)
    }
    fetch()
  }, [id, supabase])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    for (const file of files) {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/admin/upload/product-image", { method: "POST", body: formData })
        const data = await res.json()
        if (data.url) {
          setImages((prev) => [...prev, { url: data.url }])
        }
      } catch { /* ignore */ }
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const moveImage = (index: number, direction: "up" | "down") => {
    setImages((prev) => {
      const next = [...prev]
      const target = direction === "up" ? index - 1 : index + 1
      if (target < 0 || target >= next.length) return next
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const addColor = () => {
    setForm((prev) => ({ ...prev, colors: [...prev.colors, { name: "", hex: "#c1623d" }] }))
  }

  const updateColor = (index: number, field: "name" | "hex", value: string) => {
    setForm((prev) => {
      const colors = [...prev.colors]
      colors[index] = { ...colors[index], [field]: value }
      return { ...prev, colors }
    })
  }

  const removeColor = (index: number) => {
    setForm((prev) => ({ ...prev, colors: prev.colors.filter((_, i) => i !== index) }))
  }

  const toggleSize = (size: string) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }))
  }

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const body = {
        ...form,
        price: parseFloat(form.price),
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        inventory_count: parseInt(form.inventory_count),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        images: images.map((img) => ({ url: img.url, alt_text: form.name })),
      }

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        router.push("/admin/products")
      } else {
        const data = await res.json()
        alert(data.error || "Failed to update product")
      }
    } catch {
      alert("Failed to update product")
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-48 rounded bg-muted" /><div className="h-96 rounded-xl bg-muted" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/products" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to Products
      </Link>

      <h1 className="font-heading text-2xl font-bold text-brand-forest">Edit Product</h1>

      <form onSubmit={saveProduct} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-lg font-bold text-brand-forest">Basic Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-brand-forest focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug *</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-brand-forest focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Short Description</label>
            <input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-brand-forest focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-brand-forest focus:outline-none" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              {categories.length > 0 ? (
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-brand-forest focus:outline-none">
                  <option value="">Select category</option>
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              ) : (
                <div className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
                  No categories available.
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags <span className="text-muted-foreground">(comma-separated)</span></label>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-brand-forest focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Craft Type</label>
            <select value={form.craft_type} onChange={(e) => setForm({ ...form, craft_type: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-brand-forest focus:outline-none">
              {CRAFT_TYPES.map((type) => (<option key={type} value={type}>{type}</option>))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-lg font-bold text-brand-forest">Pricing & Inventory</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-1">Price (PKR) *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-brand-forest focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sale Price</label>
              <input type="number" min="0" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-brand-forest focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Inventory Count</label>
              <input type="number" min="0" value={form.inventory_count} onChange={(e) => setForm({ ...form, inventory_count: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-brand-forest focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded border-border text-brand-forest" />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded border-border text-brand-forest" />
              Active
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-lg font-bold text-brand-forest">Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Fabric</label>
              <input value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-brand-forest focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Care Instructions</label>
              <input value={form.care_instructions} onChange={(e) => setForm({ ...form, care_instructions: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-brand-forest focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-lg font-bold text-brand-forest">Sizes & Colors</h2>
          <div>
            <p className="text-sm font-medium mb-2">Available Sizes</p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <button key={size} type="button" onClick={() => toggleSize(size)}
                  className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${
                    form.sizes.includes(size) ? "border-brand-forest bg-brand-forest text-white" : "border-border hover:border-brand-forest"
                  }`}
                >{size}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Available Colors</p>
              <button type="button" onClick={addColor} className="text-xs text-brand-forest underline">+ Add Color</button>
            </div>
            <div className="space-y-2">
              {form.colors.map((color, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={color.hex} onChange={(e) => updateColor(i, "hex", e.target.value)} className="h-8 w-8 cursor-pointer rounded border border-border" />
                  <input placeholder="Color name" value={color.name} onChange={(e) => updateColor(i, "name", e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none" />
                  <button type="button" onClick={() => removeColor(i)} className="text-muted-foreground hover:text-red-500"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-lg font-bold text-brand-forest">Images</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img, i) => (
              <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand-forest px-1.5 py-0.5 text-[10px] text-white">Primary</span>}
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                  <button type="button" onClick={() => moveImage(i, "up")} disabled={i === 0} className="rounded bg-white p-1 disabled:opacity-30"><GripVertical className="h-3 w-3 rotate-90 text-brand-forest" /></button>
                  <button type="button" onClick={() => removeImage(i)} className="rounded bg-white p-1"><X className="h-3 w-3 text-red-500" /></button>
                </div>
              </div>
            ))}
            <label className="flex aspect-[3/4] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-brand-forest">
              {uploading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-forest border-t-transparent" />
              ) : (
                <div className="text-center"><Upload className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-1 text-xs text-muted-foreground">Upload</p></div>
              )}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="rounded-full bg-brand-forest px-8 py-2.5 text-sm font-medium text-white disabled:opacity-50">
            {saving ? "Saving..." : "Update Product"}
          </button>
          <Link href="/admin/products" className="rounded-full border border-border px-8 py-2.5 text-sm font-medium">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
