import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { storeName, baseUrl } from "@/lib/constants"
import WorkshopBookContent from "./WorkshopBookContent"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: workshop } = await supabase
    .from("workshops")
    .select("title, short_description")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!workshop) return { title: `Workshop Not Found - ${storeName}` }

  return {
    title: `Book: ${workshop.title} - ${storeName}`,
    description: workshop.short_description || `Register for ${workshop.title} at ${storeName}.`,
    robots: { index: false, follow: true },
    openGraph: {
      title: `Book: ${workshop.title}`,
      description: workshop.short_description || undefined,
      url: `${baseUrl}/skills-studio/${slug}/book`,
    },
  }
}

export default async function WorkshopBookPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: workshop } = await supabase
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!workshop) notFound()

  return <WorkshopBookContent workshop={workshop as any} />
}