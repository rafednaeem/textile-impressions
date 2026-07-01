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

  // Check if current user has a confirmed registration
  let userRegistrationStatus: string | null = null
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: reg } = await supabase
      .from("workshop_registrations")
      .select("status")
      .eq("workshop_id", workshop.id)
      .eq("user_id", user.id)
      .in("status", ["confirmed", "awaiting_payment", "payment_submitted", "waitlisted"])
      .maybeSingle()

    userRegistrationStatus = reg?.status || null
  }

  return (
    <WorkshopDetailContent
      workshop={workshop as any}
      userRegistrationStatus={userRegistrationStatus}
    />
  )
}
