"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Calendar, Clock, MapPin, Monitor, Users, Check, ChevronLeft, Package, ExternalLink,
} from "lucide-react"
import type { Workshop } from "@/types/workshop"
import { WORKSHOP_FORMAT_LABELS, WORKSHOP_LEVEL_LABELS } from "@/lib/constants"

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString("en-PK", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })
}

export default function WorkshopDetailContent({ workshop }: { workshop: Workshop }) {
  const isFree = workshop.fee === 0
  const isFull = workshop.seats_remaining !== null && workshop.seats_remaining <= 0
  const spotsLeft = workshop.seats_remaining ?? null

  return (
    <div className="bg-brand-ivory">
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        <Link href="/skills-studio" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-brand-forest mb-6">
          <ChevronLeft className="h-4 w-4" />
          Back to Skills Studio
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            {workshop.cover_image_url ? (
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
                <Image src={workshop.cover_image_url} alt={workshop.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 60vw" priority />
              </div>
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-brand-indigo/10">
                <Calendar className="h-16 w-16 text-brand-indigo/30" />
              </div>
            )}

            <div className="mt-8">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-brand-indigo/10 px-3 py-1 text-xs font-bold text-brand-indigo">
                  {WORKSHOP_FORMAT_LABELS[workshop.format]}
                </span>
                <span className="rounded-full bg-brand-forest/10 px-3 py-1 text-xs font-bold text-brand-forest">
                  {WORKSHOP_LEVEL_LABELS[workshop.level]}
                </span>
                {isFree && (
                  <span className="rounded-full bg-brand-saffron/20 px-3 py-1 text-xs font-bold text-brand-umber">Free Workshop</span>
                )}
                {workshop.materials_included && (
                  <span className="rounded-full bg-brand-terracotta/10 px-3 py-1 text-xs font-bold text-brand-terracotta">Materials Included</span>
                )}
              </div>

              <h1 className="mt-4 font-heading text-3xl font-bold text-brand-indigo sm:text-4xl">{workshop.title}</h1>

              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                {workshop.description?.split("\n").map((para, i) => (
                  <p key={i}>{para}</p>
                )) || <p>{workshop.short_description}</p>}
              </div>

              {workshop.materials_list && (
                <div className="mt-8 rounded-xl border border-border p-6">
                  <h3 className="flex items-center gap-2 font-heading text-lg font-semibold text-brand-forest">
                    <Package className="h-5 w-5" />
                    Materials
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{workshop.materials_list}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <div className="text-center">
                <span className="text-3xl font-bold text-brand-forest">
                  {isFree ? "Free" : `Rs. ${workshop.fee.toLocaleString()}`}
                </span>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                {workshop.instructor_name && (
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-forest" />
                    <div>
                      <p className="font-medium text-brand-forest">Instructor</p>
                      <p className="text-muted-foreground">{workshop.instructor_name}</p>
                    </div>
                  </div>
                )}
                {workshop.date_start && (
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-brand-forest" />
                    <div>
                      <p className="font-medium text-brand-forest">Date</p>
                      <p className="text-muted-foreground">{formatDate(workshop.date_start)}</p>
                      {workshop.date_end && <p className="text-muted-foreground text-xs">to {formatDate(workshop.date_end)}</p>}
                    </div>
                  </div>
                )}
                {workshop.duration_minutes && (
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-forest" />
                    <div>
                      <p className="font-medium text-brand-forest">Duration</p>
                      <p className="text-muted-foreground">{workshop.duration_minutes} minutes</p>
                      {workshop.date_start && <p className="text-muted-foreground text-xs">Starts at {formatTime(workshop.date_start)} PKT</p>}
                    </div>
                  </div>
                )}
                {workshop.format === "in_person" && workshop.location_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-forest" />
                    <div>
                      <p className="font-medium text-brand-forest">Location</p>
                      <p className="text-muted-foreground">{workshop.location_address}</p>
                    </div>
                  </div>
                )}
                {workshop.format !== "in_person" && (
                  <div className="flex items-start gap-3">
                    <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-brand-forest" />
                    <div>
                      <p className="font-medium text-brand-forest">Online Session</p>
                      <p className="text-muted-foreground capitalize">{workshop.online_meeting_platform || "Online"}</p>
                      {workshop.online_meeting_url && (
                        <a href={workshop.online_meeting_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-terracotta hover:underline">
                          Meeting Link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {spotsLeft !== null && (
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand-forest" />
                    <div>
                      <p className="font-medium text-brand-forest">Seats</p>
                      <p className="text-muted-foreground">{isFull ? "This session is full" : `${spotsLeft} spots remaining`}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                {isFull ? (
                  <div className="text-center text-sm font-medium text-muted-foreground">This workshop is fully booked.</div>
                ) : (
                  <Link
                    href={`/skills-studio/${workshop.slug}/book`}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-forest px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-forest/90"
                  >
                    {isFree ? "Register for Free" : `Book Now - Rs. ${workshop.fee.toLocaleString()}`}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}