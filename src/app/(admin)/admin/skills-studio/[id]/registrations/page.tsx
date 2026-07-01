import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import RegistrationsManager from "./RegistrationsManager"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function RegistrationsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: workshop } = await supabase
    .from("workshops")
    .select("id, title, fee, format, max_seats, seats_remaining")
    .eq("id", id)
    .single()

  if (!workshop) notFound()

  return (
    <RegistrationsManager
      workshopId={workshop.id}
      workshopTitle={workshop.title}
      workshopFee={workshop.fee}
      workshopFormat={workshop.format}
    />
  )
}
