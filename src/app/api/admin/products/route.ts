import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

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
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
  }

  const { data: products, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })

  return NextResponse.json({ products, count, page, totalPages: Math.ceil((count || 0) / limit) })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const { name, slug, description, short_description, price, sale_price, sku, inventory_count, category_id, tags, craft_type, fabric, care_instructions, is_featured, images, sizes, colors } = body

  if (!name || !slug || !sku || price === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name, slug, description, short_description, price, sale_price: sale_price || null,
      sku, inventory_count: inventory_count || 0, category_id: category_id || null,
      is_active: true, is_featured: is_featured || false,
      tags: tags || [], craft_type: craft_type || "Plain", fabric: fabric || null, care_instructions: care_instructions || null,
    })
    .select("id")
    .single()

  if (productError) {
    if (productError.code === "23505") {
      return NextResponse.json({ error: "Product with this slug or SKU already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }

  if (images?.length) {
    await supabase.from("product_images").insert(
      images.map((img: any, i: number) => ({
        product_id: product.id,
        url: img.url,
        alt_text: img.alt_text || name,
        sort_order: i,
        is_primary: i === 0,
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
