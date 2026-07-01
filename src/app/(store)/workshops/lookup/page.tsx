"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Calendar, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { WORKSHOP_FORMAT_LABELS, WORKSHOP_REGISTRATION_STATUS_LABELS } from "@/lib/constants"

interface Registration {
  id: string
  status: string
  payment_status: string
  registered_at: string
  guest_name: string | null
  workshop: {
    id: string
    title: string
    slug: string
    format: string
    date_start: string | null
    location_address: string | null
    meeting_link: string | null
    online_meeting_platform: string | null
  } | null
}

export default function WorkshopLookupPage() {
  const [email, setEmail] = useState("")
  const [searching, setSearching] = useState(false)
  const [registrations, setRegistrations] = useState<Registration[] | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error("Please enter your email address")
      return
    }

    setSearching(true)
    try {
      const res = await fetch("/api/workshops/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to look up registrations")
        return
      }

      setRegistrations(data.registrations)
      setSearched(true)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="bg-brand-ivory px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-2xl font-bold text-brand-forest">Find Your Registration</h1>
        <p className="mt-2 text-muted-foreground">
          Enter the email address you used to register for a workshop.
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
          />
          <button
            type="submit"
            disabled={searching}
            className="flex items-center gap-2 rounded-full bg-brand-forest px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-brand-forest/90"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </form>

        {searched && registrations !== null && (
          <div className="mt-8">
            {registrations.length === 0 ? (
              <div className="rounded-xl border border-border bg-white p-8 text-center">
                <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
                <h2 className="mt-3 font-heading text-lg font-bold text-brand-forest">No registrations found</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  No workshop registrations were found for {email}.
                </p>
                <Link href="/skills-studio" className="mt-4 inline-block rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white">
                  Browse Workshops
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Found {registrations.length} registration{registrations.length !== 1 ? "s" : ""}:
                </p>
                {registrations.map((reg) => {
                  const workshop = reg.workshop
                  if (!workshop) return null

                  const isConfirmed = reg.status === "confirmed"
                  const showMeetingLink = isConfirmed && workshop.meeting_link

                  return (
                    <div key={reg.id} className="rounded-xl border border-border bg-white p-4">
                      <div className="flex items-start justify-between">
                        <div>
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
                              : reg.status === "waitlisted" ? "bg-gray-100 text-gray-700"
                              : reg.status === "cancelled" ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                            }`}>
                              {WORKSHOP_REGISTRATION_STATUS_LABELS[reg.status as keyof typeof WORKSHOP_REGISTRATION_STATUS_LABELS] || reg.status}
                            </span>
                          </div>
                          {isConfirmed && workshop.location_address && workshop.format !== "online" && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Location: {workshop.location_address}
                            </p>
                          )}
                          {showMeetingLink && (
                            <a
                              href={workshop.meeting_link!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs text-brand-terracotta hover:underline"
                            >
                              Join {workshop.online_meeting_platform || "Online"} Meeting <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
