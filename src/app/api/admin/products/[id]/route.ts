import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { data: product, error: queryError } = await supabase
    .from("products")
    .select("*, categories(name), product_images(*), product_variants(*)")
    .eq("id", id)
    .single()

  if (queryError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  return NextResponse.json(product)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const updateData: any = {}

  const fields = [
    "name", "slug", "description", "short_description", "price", "sale_price",
    "inventory_count", "is_active", "is_featured", "category_id",
    "tags", "craft_type", "fabric", "care_instructions",
  ]

  for (const field of fields) {
    if (body[field] !== undefined) updateData[field] = body[field]
  }

  const { error: updateError } = await supabase.from("products").update(updateData).eq("id", id)
  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json({ error: "Product with this slug already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }

  if (body.images) {
    await supabase.from("product_images").delete().eq("product_id", id)
    if (body.images.length) {
      await supabase.from("product_images").insert(
        body.images.map((img: any, i: number) => ({
          product_id: id,
          url: img.url,
          alt_text: img.alt_text,
          sort_order: i,
          is_primary: i === 0,
        }))
      )
    }
  }

  if (body.sizes !== undefined || body.colors !== undefined) {
    await supabase.from("product_variants").delete().eq("product_id", id)
    const sizes = body.sizes || []
    const colors = body.colors || []
    const variantInserts: any[] = []
    if (sizes.length && colors.length) {
      for (const size of sizes) {
        for (const color of colors) {
          variantInserts.push({ product_id: id, size, color, inventory_count: 0 })
        }
      }
    } else if (sizes.length) {
      for (const size of sizes) {
        variantInserts.push({ product_id: id, size, inventory_count: 0 })
      }
    } else if (colors.length) {
      for (const color of colors) {
        variantInserts.push({ product_id: id, color, inventory_count: 0 })
      }
    }
    if (variantInserts.length) {
      await supabase.from("product_variants").insert(variantInserts)
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { error: deleteError } = await supabase.from("products").delete().eq("id", id)
  if (deleteError) return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })

  return NextResponse.json({ success: true })
}
