"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingBag } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Product } from "@/types/database"
import { useCart } from "@/hooks/useCart"

interface ProductCardProps {
  product: Product
}

const craftTagClasses: Record<string, string> = {
  "Block Print": "bg-brand-saffron text-brand-umber",
  Ajrak: "bg-brand-indigo text-brand-ivory",
  "Hand Embroidered": "bg-brand-crimson text-brand-ivory",
  Chunri: "bg-brand-teal text-white",
  Plain: "bg-gray-200 text-gray-700",
}

export default function ProductCard({ product }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const { addItem } = useCart()
  const supabase = createClient()
  const { id: productId, sale_price, price, name, slug, inventory_count, craft_type } = product
  const hasDiscount = sale_price != null && sale_price < price
  const displayPrice = sale_price ?? price
  const isLowStock = inventory_count > 0 && inventory_count < 5
  const isOutOfStock = inventory_count === 0
  const craftType = craft_type || "Plain"
  const craftClass = craftTagClasses[craftType] || "bg-gray-200 text-gray-700"

  const imageUrl = `https://picsum.photos/seed/${slug}/600/800`
  const hoverImageUrl = `https://picsum.photos/seed/${slug}h/600/800`

  useEffect(() => {
    const checkWishlist = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle()
      if (data) setWishlisted(true)
    }
    checkWishlist()
  }, [supabase, productId])

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    addItem({
      product: {
        id: productId,
        name,
        slug,
        price,
        sale_price,
        inventory_count,
      },
      image: imageUrl,
    })
    toast(`${name} added to cart`, {
      description: "View your cart to checkout",
            icon: <ShoppingBag className="h-4 w-4 text-brand-indigo" />,
    })
  }

  const handleWishlist = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (wishlistLoading) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Please sign in to add items to your wishlist")
      return
    }

    setWishlistLoading(true)
    try {
      if (wishlisted) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId)
        if (error) throw error
        setWishlisted(false)
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id, product_id: productId })
        if (error) throw error
        setWishlisted(true)
        toast(`${name} added to wishlist`, {
          icon: <Heart className="h-4 w-4 text-red-500" />,
        })
      }
    } catch {
      toast.error("Failed to update wishlist")
    } finally {
      setWishlistLoading(false)
    }
  }, [supabase, productId, wishlisted, wishlistLoading, name])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
      data-testid="product-card"
    >
      <Link href={`/products/${slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition-opacity duration-500 group-hover:opacity-0"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <Image
            src={hoverImageUrl}
            alt={`${name} alternate view`}
            fill
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          <span className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-bold ${craftClass}`}>
            {craftType}
          </span>
          {hasDiscount && (
            <span className="absolute left-2 top-9 rounded-full bg-brand-crimson px-2.5 py-0.5 text-xs font-medium text-white">
              {Math.round(((price - sale_price!) / price) * 100)}% OFF
            </span>
          )}
          {isLowStock && (
            <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Low Stock
            </span>
          )}

          <button
            onClick={handleWishlist}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-all hover:text-red-500 group-hover:opacity-100"
            aria-label="Add to wishlist"
          >
            <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </button>

          <div className="absolute inset-x-0 bottom-0 translate-y-full p-3 transition-transform duration-300 group-hover:translate-y-0">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              data-testid="quick-add-button"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-indigo py-2.5 text-sm font-medium text-brand-ivory shadow-lg transition-colors hover:bg-brand-indigo/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" />
              {isOutOfStock ? "Out of Stock" : "Quick Add"}
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-1 px-1">
          <h3 className="text-sm font-medium leading-tight">{name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-brand-indigo">
              Rs. {displayPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                Rs. {price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
