"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Heart, Minus, Plus, ShoppingBag, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Product, ProductImage, ProductVariant, Category } from "@/types/database"
import { useCart } from "@/hooks/useCart"
import ProductCard from "@/components/store/ProductCard"

const tabs = ["Description", "Size Guide", "Care Instructions"] as const

const colorMap: Record<string, string> = {
  black: "#1a1a1a",
  white: "#ffffff",
  navy: "#1a2744",
  red: "#c1623d",
  blue: "#3b6ea5",
  green: "#1a3a2a",
  gold: "#d4a637",
  silver: "#b0b0b0",
  "rose gold": "#c48b7d",
  emerald: "#2d5a3f",
  "moss green": "#5a7a4a",
  "dusty rose": "#c48b7d",
  champagne: "#f7e7ce",
  ivory: "#fffff0",
  teal: "#1a6b6b",
  maroon: "#6b1a2a",
  lavender: "#b8a8d4",
  "pastel pink": "#f4c2c2",
  mint: "#b8d4b8",
  "sky blue": "#b8d4e8",
  "bottle green": "#1a3a2a",
  "royal blue": "#1a2a6b",
}

export default function ProductDetailContent({ slug }: { slug: string }) {
  const supabase = createClient()
  const { addItem } = useCart()

  const [product, setProduct] = useState<(Product & { category?: Category }) | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<string>("Description")
  const [wishlisted, setWishlisted] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      const { data: prodData } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .single()

      if (!prodData) {
        setLoading(false)
        return
      }

      const prod = prodData as unknown as Product & { category?: Category }

      if (prod.category_id) {
        const { data: catData } = await supabase
          .from("categories")
          .select("*")
          .eq("id", prod.category_id)
          .single()
        if (catData) prod.category = catData as unknown as Category
      }

      setProduct(prod)

      const [imgRes, varRes] = await Promise.all([
        supabase
          .from("product_images")
          .select("*")
          .eq("product_id", prod.id)
          .order("sort_order"),
        supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", prod.id),
      ])

      if (imgRes.data) setImages(imgRes.data as unknown as ProductImage[])
      if (varRes.data) setVariants(varRes.data as unknown as ProductVariant[])

      if (prod.category_id) {
        const { data: relData } = await supabase
          .from("products")
          .select("*")
          .eq("category_id", prod.category_id)
          .eq("is_active", true)
          .neq("id", prod.id)
          .limit(4)

        if (relData) setRelated(relData as unknown as Product[])
      }

      setLoading(false)
    }

    fetchProduct()
  }, [slug, supabase])

  const displayImages =
    images.length > 0
      ? images
      : ([
          {
            id: "placeholder",
            product_id: "",
            url: `https://picsum.photos/seed/${slug}/600/800`,
            alt_text: null,
            sort_order: 0,
            is_primary: true,
          },
        ] as ProductImage[])

  if (!loading && !product) notFound()

  const hasDiscount = product?.sale_price != null && product!.sale_price < product!.price
  const displayPrice = product?.sale_price ?? product?.price ?? 0
  const inventoryCount = product?.inventory_count ?? 0

  const availableSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))]
  const availableColors = [...new Set(variants.map((v) => v.color).filter(Boolean))]

  const currentVariant = variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  )
  const variantInventory = currentVariant?.inventory_count ?? inventoryCount
  const isOutOfStock = inventoryCount === 0 || variantInventory === 0

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return
    addItem({
      product: {
        name: product.name,
        slug: product.slug,
        price: product.price,
        sale_price: product.sale_price,
        inventory_count: product.inventory_count,
      },
      image: displayImages[0]?.url ?? null,
      variant: currentVariant
        ? { size: currentVariant.size, color: currentVariant.color }
        : null,
      quantity,
    })
    setAdded(true)
    toast(`${product.name} added to cart`, {
      description: "View your cart to checkout",
      icon: <ShoppingBag className="h-4 w-4 text-brand-forest" />,
    })
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        <div className="animate-pulse lg:flex lg:gap-12">
          <div className="aspect-[3/4] w-full rounded-xl bg-muted lg:w-1/2" />
          <div className="mt-6 flex-1 space-y-4 lg:mt-0">
            <div className="h-8 w-3/4 rounded bg-muted" />
            <div className="h-6 w-1/4 rounded bg-muted" />
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="h-12 w-full rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-brand-forest">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-brand-forest">
          Shop
        </Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/shop?category=${(product.category as Category).slug}`}
              className="hover:text-brand-forest"
            >
              {(product.category as Category).name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="lg:flex lg:gap-12">
        <div className="lg:w-1/2">
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
            <Image
              src={displayImages[selectedImage]?.url ?? `https://picsum.photos/seed/${slug}/600/800`}
              alt={displayImages[selectedImage]?.alt_text || product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {hasDiscount && (
              <span className="absolute left-3 top-3 rounded-full bg-brand-terracotta px-3 py-1 text-xs font-medium text-white">
                {Math.round(((product.price - product.sale_price!) / product.price) * 100)}% OFF
              </span>
            )}
          </div>

          {displayImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {displayImages.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === selectedImage ? "border-brand-forest" : "border-transparent"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt_text || `View ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 lg:mt-0 lg:w-1/2">
          <h1
            className="font-heading text-3xl font-bold text-brand-forest"
            data-testid="product-heading"
          >
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span
              className="text-2xl font-bold text-brand-forest"
              data-testid="product-price"
            >
              Rs. {displayPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                Rs. {product.price.toLocaleString()}
              </span>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            {product.sku && (
              <p>
                <span className="font-medium text-foreground">SKU:</span> {product.sku}
              </p>
            )}
            {product.fabric && (
              <p>
                <span className="font-medium text-foreground">Fabric:</span> {product.fabric}
              </p>
            )}
          </div>

          {availableSizes.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-medium">
                Size{" "}
                <span className="font-normal text-muted-foreground">
                  - {selectedSize || "Select"}
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`flex h-9 min-w-[3rem] items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? "border-brand-forest bg-brand-forest text-white"
                        : "border-border hover:border-brand-forest"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableColors.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-medium">
                Color{" "}
                <span className="font-normal text-muted-foreground">
                  - {selectedColor || "Select"}
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => {
                  const hex = colorMap[color?.toLowerCase() ?? ""] || "#ccc"
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                        selectedColor === color
                          ? "scale-110 border-brand-forest"
                          : "border-border hover:border-brand-forest"
                      }`}
                      style={{ backgroundColor: hex }}
                      title={color ?? ""}
                    >
                      {selectedColor === color && (
                        <Check
                          className={`h-4 w-4 ${hex === "#ffffff" ? "text-black" : "text-white"}`}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium">Quantity</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-lg font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              data-testid="add-to-cart-button"
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-forest px-8 py-3 text-sm font-medium text-white transition-all hover:bg-brand-forest/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span
                    key="added"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" /> Added to Cart
                  </motion.span>
                ) : (
                  <motion.span key="add" className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              onClick={() => {
                setWishlisted(!wishlisted)
                if (!wishlisted) {
                  toast(`${product.name} added to wishlist`, {
                    icon: <Heart className="h-4 w-4 text-red-500" />,
                  })
                }
              }}
              className="flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Heart
                className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`}
              />
              {wishlisted ? "Wishlisted" : "Add to Wishlist"}
            </button>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <div className="flex gap-4 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-brand-forest text-brand-forest"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {activeTab === "Description" && (
                <p>{product.description || "No description available."}</p>
              )}
              {activeTab === "Size Guide" && (
                <div className="space-y-2">
                  <p>We offer sizes S through XL. Measurements (in inches):</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>S: Chest 36-38, Length 42</li>
                    <li>M: Chest 38-40, Length 43</li>
                    <li>L: Chest 40-42, Length 44</li>
                    <li>XL: Chest 42-44, Length 45</li>
                  </ul>
                  <p className="mt-2 text-xs italic">
                    For custom measurements, please contact us on WhatsApp.
                  </p>
                </div>
              )}
              {activeTab === "Care Instructions" && (
                <p>{product.care_instructions || "Contact us for care instructions."}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-border pt-12">
          <h2 className="mb-6 font-heading text-2xl font-bold text-brand-forest">
            You May Also Like
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

