import type { Metadata } from "next"
import Link from "next/link"
import { storeName, baseUrl } from "@/lib/constants"
import ColorsContent from "./ColorsContent"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Sustainable Colors & Paints - ${storeName}`,
    description: "Explore our range of sustainable textile colors - natural dyes, block printing paints, and fabric paints. Eco-friendly, artisan-crafted for your creative projects.",
    openGraph: {
      title: `Sustainable Colors & Paints - ${storeName}`,
      description: "Eco-friendly textile colors crafted by Pakistani artisans.",
      url: `${baseUrl}/colors`,
      type: "website",
    },
  }
}

export default function ColorsPage() {
  return <ColorsContent />
}