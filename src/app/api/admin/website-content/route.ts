import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/supabase/admin"
import { isValidContentKey } from "@/lib/website-content"

const PAGE_PATHS: Record<string, string[]> = {
  home: ["/"],
  shop: ["/shop"],
  "skills-studio": ["/skills-studio"],
  about: ["/about"],
  lookbook: ["/lookbook"],
  colors: ["/colors"],
  "custom-orders": ["/custom-orders"],
  incubator: ["/incubator"],
  footer: ["/", "/shop", "/skills-studio", "/about", "/lookbook", "/colors", "/custom-orders", "/incubator", "/craft-guide"],
}

export async function GET() {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { data, error: dbError } = await supabase
    .from("website_content")
    .select("*")
    .order("page")
    .order("section")
    .order("field")

  if (dbError) {
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const updates: { page: string; section: string; field: string; value: string }[] = body.updates

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    // Validate all keys against the whitelist and basic structure.
    for (const item of updates) {
      if (
        typeof item.page !== "string" ||
        typeof item.section !== "string" ||
        typeof item.field !== "string" ||
        typeof item.value !== "string"
      ) {
        return NextResponse.json({ error: "Invalid update structure" }, { status: 400 })
      }
      if (!isValidContentKey(item.page, item.section, item.field)) {
        return NextResponse.json(
          { error: `Invalid content key: ${item.page}.${item.section}.${item.field}` },
          { status: 400 }
        )
      }
    }

    // Upsert all values.
    const { error: upsertError } = await supabase
      .from("website_content")
      .upsert(updates, { onConflict: "page,section,field" })

    if (upsertError) {
      return NextResponse.json({ error: "Failed to save content" }, { status: 500 })
    }

    // Revalidate affected public paths.
    const revalidatedPages = new Set<string>()
    for (const item of updates) {
      const paths = PAGE_PATHS[item.page] ?? []
      for (const path of paths) {
        if (!revalidatedPages.has(path)) {
          revalidatedPages.add(path)
          revalidatePath(path)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
