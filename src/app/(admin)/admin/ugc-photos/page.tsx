"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

export default function AdminUgcPhotosPage() {
  const supabase = createClient()
  const [photos, setPhotos] = useState<any[]>([])

  const fetchPhotos = async () => {
    const { data } = await supabase.from("ugc_photos").select("*, products(name)").order("created_at", { ascending: false })
    if (data) setPhotos(data)
  }

  useEffect(() => {
    fetchPhotos()
  }, [])

  const setApproved = async (id: string, is_approved: boolean) => {
    await supabase.from("ugc_photos").update({ is_approved }).eq("id", id)
    fetchPhotos()
  }

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold text-brand-forest">UGC Photos</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <div key={photo.id} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="relative aspect-square bg-muted">
              <Image src={photo.image_url} alt={photo.customer_name} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 33vw" />
            </div>
            <div className="space-y-3 p-4">
              <div>
                <p className="font-medium">{photo.customer_name}</p>
                <p className="text-xs text-muted-foreground">{photo.products?.name || "No linked product"}</p>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${photo.is_approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {photo.is_approved ? "Approved" : "Pending"}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setApproved(photo.id, true)} className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white">Approve</button>
                <button onClick={() => setApproved(photo.id, false)} className="rounded-lg bg-brand-crimson px-3 py-1 text-sm text-white">Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
