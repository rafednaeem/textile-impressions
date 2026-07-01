import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getServiceRoleClient } from "@/lib/supabase/service-role"
import WorkshopPaymentContent from "./WorkshopPaymentContent"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ registration?: string }>
}

export default async function WorkshopPaymentPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { registration: registrationId } = await searchParams

  if (!registrationId) notFound()

  const supabase = await createClient()

  const { data: workshop } = await supabase
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!workshop) notFound()

  // Use service role to allow guest registrants to view their own registration
  const serviceRole = getServiceRoleClient()

  const { data: registration } = await serviceRole
    .from("workshop_registrations")
    .select("id, status, payment_status, guest_email")
    .eq("id", registrationId)
    .eq("workshop_id", workshop.id)
    .single()

  if (!registration) notFound()

  if (registration.status !== "awaiting_payment" && registration.status !== "payment_submitted") {
    notFound()
  }

  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("key, value")

  const settings: Record<string, string> = {}
  siteSettings?.forEach((s) => { settings[s.key] = s.value })

  return (
    <WorkshopPaymentContent
      workshop={workshop as any}
      registration={registration as any}
      bankDetails={{
        bank: settings.bank_name || "Meezan Bank",
        accountName: settings.bank_account_title || "Textile Impressions",
        accountNumber: settings.bank_account || "1234567890",
        iban: settings.bank_iban || "PK36MEZN0001234567890",
      }}
    />
  )
}
