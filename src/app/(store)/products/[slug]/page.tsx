import Script from "next/script"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import { storeName, baseUrl } from "@/lib/constants"
import ProductDetailContent from "./ProductDetailContent"

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("name, description, sale_price, price")
    .eq("slug", slug)
    .single()

  const product = data as { name: string; description: string | null; sale_price: number | null; price: number } | null

  if (!product) return { title: "Product Not Found" }

  const description = product.description
    ? product.description.length > 160
      ? product.description.slice(0, 157) + "..."
      : product.description
    : undefined

  return {
    title: `${product.name} — ${storeName}`,
    description,
    openGraph: {
      title: product.name,
      description,
      url: `${baseUrl}/products/${slug}`,
      images: [{ url: `${baseUrl}/api/og/product/${slug}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from("products")
    .select("*, product_images(url)")
    .eq("slug", slug)
    .single()

  const product = raw as { name: string; description: string | null; price: number; sale_price: number | null; slug: string } | null

  if (!product) return <ProductDetailContent slug={slug} />

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: `${baseUrl}/api/og/product/${slug}`,
    offers: {
      "@type": "Offer",
      price: product.sale_price || product.price,
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/products/${slug}`,
    },
    brand: {
      "@type": "Brand",
      name: storeName,
    },
  }

  return (
    <>
      <Script id="product-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(productSchema)}
      </Script>
      <ProductDetailContent slug={slug} />
    </>
  )
}
