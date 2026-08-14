import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"
import type { MediaInput } from "@/lib/media"

export async function GET(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabase
    .from("products")
    .select("*, categories(name), product_images(*)", { count: "exact" })

  if (category) query = query.eq("category_id", category)
  if (search) {
    query = query.ilike("name", `%${search}%`)
  }

  const { data: products, count, error: queryError } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (queryError) return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })

  return NextResponse.json({ products, count, page, totalPages: Math.ceil((count || 0) / limit) })
}

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { name, slug, description, short_description, price, sale_price, inventory_count, category_id, tags, craft_type, fabric, care_instructions, is_featured, pricing_enabled, whatsapp_inquiry_enabled, media, images, sizes, colors } = body

  const isPricingEnabled = pricing_enabled === true
  const isWhatsAppEnabled = whatsapp_inquiry_enabled === true

  if (!name || !slug) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!isPricingEnabled && !isWhatsAppEnabled) {
    return NextResponse.json({ error: "Please enable either Pricing or WhatsApp Inquiry for this product." }, { status: 400 })
  }

  if (isPricingEnabled && (price === undefined || price === null || Number.isNaN(Number(price)) || Number(price) < 0)) {
    return NextResponse.json({ error: "Price is required when Pricing is enabled" }, { status: 400 })
  }

  const finalPrice = isPricingEnabled ? Number(price) : null
  const finalSalePrice = isPricingEnabled && sale_price ? Number(sale_price) : null

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name, slug, description, short_description, price: finalPrice, sale_price: finalSalePrice,
      inventory_count: inventory_count || 0, category_id: category_id || null,
      is_active: true, is_featured: is_featured || false,
      pricing_enabled: isPricingEnabled, whatsapp_inquiry_enabled: isWhatsAppEnabled,
      tags: tags || [], craft_type: craft_type || "Plain", fabric: fabric || null, care_instructions: care_instructions || null,
    })
    .select("id")
    .single()

  if (productError) {
    console.error("Supabase error creating product:", productError)
    if (productError.code === "23505") {
      return NextResponse.json({ error: "Product with this slug already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: `Failed to create product: ${productError.message} (${productError.details || ''})` }, { status: 500 })
  }

  const mediaItems: MediaInput[] = Array.isArray(media) && media.length
    ? media
    : Array.isArray(images) && images.length
      ? images.map((img: MediaInput) => ({ ...img, media_type: "image" as const }))
      : []

  if (mediaItems.length) {
    await supabase.from("product_images").insert(
      mediaItems.map((item: MediaInput, i: number) => ({
        product_id: product.id,
        url: item.url,
        storage_path: item.storage_path ?? null,
        alt_text: item.alt_text || name,
        sort_order: i,
        is_primary: i === 0,
        media_type: item.media_type || "image",
      }))
    )
  }

  const variantInserts: any[] = []
  if (sizes?.length && colors?.length) {
    for (const size of sizes) {
      for (const color of colors) {
        variantInserts.push({ product_id: product.id, size, color, inventory_count: 0 })
      }
    }
  } else if (sizes?.length) {
    for (const size of sizes) {
      variantInserts.push({ product_id: product.id, size, inventory_count: 0 })
    }
  } else if (colors?.length) {
    for (const color of colors) {
      variantInserts.push({ product_id: product.id, color, inventory_count: 0 })
    }
  }

  if (variantInserts.length) {
    await supabase.from("product_variants").insert(variantInserts)
  }

  return NextResponse.json({ id: product.id })
}
