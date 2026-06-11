import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import WorkshopBookContent from "./WorkshopBookContent"

interface Props {
  params: Promise<{ slug: string }>
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