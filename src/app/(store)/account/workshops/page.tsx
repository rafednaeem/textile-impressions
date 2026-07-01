"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, ChevronRight, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { WORKSHOP_FORMAT_LABELS, WORKSHOP_REGISTRATION_STATUS_LABELS } from "@/lib/constants"

interface Registration {
  id: string
  status: string
  payment_status: string
  registered_at: string
  workshop: {
    id: string
    title: string
    slug: string
    format: string
    date_start: string | null
    location_address: string | null
    online_meeting_url: string | null
    online_meeting_platform: string | null
  } | null
}

export default function WorkshopsPage() {
  const supabase = createClient()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("workshop_registrations")
        .select(`
          id, status, payment_status, registered_at,
          workshop:workshops(id, title, slug, format, date_start, location_address, online_meeting_url, online_meeting_platform)
        `)
        .eq("user_id", user.id)
        .not("status", "eq", "cancelled")
        .order("registered_at", { ascending: false })

      if (data) setRegistrations(data as Registration[])
      setLoading(false)
    }
    fetch()
  }, [supabase])

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (registrations.length === 0) {
    return (
      <div className="rounded-xl border border-border p-12 text-center">
        <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-3 font-heading text-xl font-bold text-brand-forest">No workshop registrations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your workshop registrations will appear here.
        </p>
        <Link
          href="/skills-studio"
          className="mt-4 inline-block rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white"
        >
          Browse Workshops
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="font-heading text-xl font-bold text-brand-forest">My Workshop Registrations</h2>
      {registrations.map((reg) => {
        const workshop = reg.workshop
        if (!workshop) return null

        const isConfirmed = reg.status === "confirmed"
        const isOnline = workshop.format === "online" || workshop.format === "hybrid"
        const showMeetingLink = isConfirmed && isOnline && workshop.online_meeting_url

        return (
          <div key={reg.id} className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link href={`/skills-studio/${workshop.slug}`} className="text-sm font-medium hover:text-brand-forest">
                  {workshop.title}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {WORKSHOP_FORMAT_LABELS[workshop.format as keyof typeof WORKSHOP_FORMAT_LABELS]} &middot;{' '}
                  {new Date(reg.registered_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
                {workshop.date_start && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(workshop.date_start).toLocaleDateString("en-PK", {
                      weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    reg.status === "confirmed" ? "bg-green-100 text-green-700"
                    : reg.status === "awaiting_payment" ? "bg-orange-100 text-orange-700"
                    : reg.status === "payment_submitted" ? "bg-blue-100 text-blue-700"
                    : reg.status === "waitlisted" ? "bg-gray-100 text-gray-700"
                    : "bg-gray-100 text-gray-600"
                  }`}>
                    {WORKSHOP_REGISTRATION_STATUS_LABELS[reg.status as keyof typeof WORKSHOP_REGISTRATION_STATUS_LABELS] || reg.status}
                  </span>
                  {reg.payment_status !== "none" && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      reg.payment_status === "verified" ? "bg-green-100 text-green-700"
                      : reg.payment_status === "submitted" ? "bg-blue-100 text-blue-700"
                      : reg.payment_status === "rejected" ? "bg-red-100 text-red-700"
                      : "bg-orange-100 text-orange-700"
                    }`}>
                      {reg.payment_status === "verified" ? "Paid" : reg.payment_status === "submitted" ? "Payment Pending" : reg.payment_status}
                    </span>
                  )}
                </div>
                {showMeetingLink && (
                  <a
                    href={workshop.online_meeting_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-brand-terracotta hover:underline"
                  >
                    Join {workshop.online_meeting_platform || "Online"} Meeting <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
