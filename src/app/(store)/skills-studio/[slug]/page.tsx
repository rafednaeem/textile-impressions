import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { storeName, baseUrl } from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"
import WorkshopDetailContent from "./WorkshopDetailContent"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: workshop } = await supabase
    .from("workshops")
    .select("title, short_description, description")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!workshop) return { title: `Workshop Not Found - ${storeName}` }

  return {
    title: `${workshop.title} - ${storeName}`,
    description: workshop.short_description || workshop.description?.slice(0, 160) || "",
    openGraph: {
      title: workshop.title,
      description: workshop.short_description || workshop.description?.slice(0, 160) || "",
      url: `${baseUrl}/skills-studio/${slug}`,
      type: "article",
    },
  }
}

export default async function WorkshopDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: workshop } = await supabase
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!workshop) notFound()

  return <WorkshopDetailContent workshop={workshop as any} />
}