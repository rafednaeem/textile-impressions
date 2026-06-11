"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function WishlistPage() {
  const supabase = createClient()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("wishlists")
        .select("*, product:products(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (data) setItems(data)
      setLoading(false)
    }
    fetch()
  }, [supabase])

  const remove = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId)
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }

  if (loading) {
    return <div className="animate-pulse grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-xl bg-muted" />
      ))}
    </div>
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border p-12 text-center">
        <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-3 font-heading text-xl font-bold text-brand-forest">Wishlist is empty</h2>
        <p className="mt-1 text-sm text-muted-foreground">Save your favorite items here.</p>
        <Link href="/shop" className="mt-4 inline-block rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-4 font-heading text-xl font-bold text-brand-forest">
        My Wishlist ({items.length})
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const p = item.product
          return (
            <div key={item.id} className="group relative">
              <Link href={`/products/${p.slug}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={`https://picsum.photos/seed/${p.slug}/600/800`}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </div>
                <div className="mt-2 px-1">
                  <h3 className="text-sm font-medium">{p.name}</h3>
                  <p className="text-sm font-semibold text-brand-forest">
                    Rs. {(p.sale_price || p.price).toLocaleString()}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => remove(item.product_id)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm transition-colors hover:bg-white"
                aria-label="Remove from wishlist"
              >
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
