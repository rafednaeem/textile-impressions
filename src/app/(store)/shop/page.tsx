import { Suspense } from "react"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { storeName, baseUrl } from "@/lib/constants"
import ShopContent from "./ShopContent"
import ProductGridSkeleton from "@/components/store/ProductGridSkeleton"

export const revalidate = 300

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}): Promise<Metadata> {
  const params = await searchParams
  const categorySlug = params.category

  if (categorySlug) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("categories")
      .select("name")
      .eq("slug", categorySlug)
      .single()

    if (data) {
      return {
        title: `${data.name} — ${storeName}`,
        description: `Shop our ${data.name} collection at ${storeName}. Handcrafted Pakistani fashion with premium quality.`,
        openGraph: {
          title: `${data.name} — ${storeName}`,
          description: `Shop our ${data.name} collection at ${storeName}.`,
          url: `${baseUrl}/shop?category=${categorySlug}`,
        },
      }
    }
  }

  return {
    title: `Shop All — ${storeName}`,
    description: `Browse our complete collection of handcrafted Pakistani fashion at ${storeName}. Discover premium textiles, embroidered suits, and more.`,
    openGraph: {
      title: `Shop All — ${storeName}`,
      description: `Browse our complete collection of handcrafted Pakistani fashion at ${storeName}.`,
      url: `${baseUrl}/shop`,
    },
  }
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ShopContent />
    </Suspense>
  )
}
