"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, Loader2, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AdminCustomerLooksPage() {
  const supabase = createClient()
  const [photos, setPhotos] = useState<any[]>([])
  const [caption, setCaption] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPhotos = async () => {
    const { data } = await supabase.from("ugc_photos").select("*").order("created_at", { ascending: false })
    if (data) setPhotos(data)
  }

  useEffect(() => {
    fetchPhotos()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "customer-looks")
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) setImageUrl(data.url)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const add = async () => {
    if (!imageUrl) return
    await supabase.from("ugc_photos").insert({
      customer_name: caption || "Customer",
      image_url: imageUrl,
      product_id: null,
      is_approved: true,
      submitted_via: "admin",
    })
    setCaption("")
    setImageUrl("")
    fetchPhotos()
  }

  const remove = async (id: string) => {
    if (!confirm("Remove this customer look?")) return
    await supabase.from("ugc_photos").delete().eq("id", id)
    fetchPhotos()
  }

  const toggleVisible = async (id: string, is_approved: boolean) => {
    await supabase.from("ugc_photos").update({ is_approved: !is_approved }).eq("id", id)
    fetchPhotos()
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-brand-forest">As Worn By Our Customers</h1>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-brand-forest">Add a customer look</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="shrink-0">
            {imageUrl ? (
              <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
                <Image src={imageUrl} alt="Preview" fill className="object-cover" sizes="96px" />
                <button type="button" onClick={() => setImageUrl("")} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground transition hover:border-brand-forest hover:text-brand-forest">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span>Photo</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          <div className="flex-1 space-y-2">
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (e.g. Customer name)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={add} disabled={!imageUrl} className="rounded-full bg-brand-forest px-5 py-2 text-sm font-medium text-white disabled:opacity-50">Add look</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <div key={photo.id} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="relative aspect-square bg-muted">
              <Image src={photo.image_url} alt={photo.customer_name} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 33vw" />
            </div>
            <div className="space-y-3 p-4">
              <p className="font-medium">{photo.customer_name}</p>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${photo.is_approved ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {photo.is_approved ? "Visible" : "Hidden"}
              </span>
              <div className="flex gap-2">
                <button onClick={() => toggleVisible(photo.id, photo.is_approved)} className="rounded-lg border border-border px-3 py-1 text-sm">
                  {photo.is_approved ? "Hide" : "Show"}
                </button>
                <button onClick={() => remove(photo.id)} className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600">Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
