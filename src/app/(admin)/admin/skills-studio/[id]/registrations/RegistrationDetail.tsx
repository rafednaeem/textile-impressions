"use client"

import { useState } from "react"
import Image from "next/image"
import { X, CheckCircle, XCircle, UserCheck, UserX, Ban, Clock, ExternalLink, Loader2 } from "lucide-react"
import { WORKSHOP_REGISTRATION_STATUS_LABELS, WORKSHOP_PAYMENT_STATUS_LABELS } from "@/lib/constants"

interface Registration {
  id: string
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  status: string
  payment_status: string
  registered_at: string
  admin_notes: string | null
  workshop: {
    id: string
    title: string
    fee: number
    format: string
    online_meeting_url: string | null
    location_address: string | null
  } | null
  payments: {
    id: string
    amount: number
    status: string
    proof_url: string | null
    transaction_ref: string | null
    rejection_reason: string | null
    verified_at: string | null
    created_at: string
  }[]
}

interface Props {
  registration: Registration
  workshopFee: number
  workshopFormat: string
  onClose: () => void
  onAction: (id: string, action: string, reason?: string) => Promise<void>
  actionLoading: boolean
}

export default function RegistrationDetail({ registration, workshopFee, workshopFormat, onClose, onAction, actionLoading }: Props) {
  const [notes, setNotes] = useState(registration.admin_notes || "")
  const [savingNotes, setSavingNotes] = useState(false)
  const [proofModalOpen, setProofModalOpen] = useState(false)
  const [selectedProof, setSelectedProof] = useState<string | null>(null)

  const latestPayment = registration.payments?.find((p) => p.status === "submitted" || p.status === "verified" || p.status === "rejected")
  const hasSubmittedPayment = registration.status === "payment_submitted"

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    await onAction(registration.id, registration.status, undefined)
    setSavingNotes(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-brand-forest">Registration Details</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Attendee Info */}
          <div>
            <h3 className="text-sm font-semibold text-brand-forest">Attendee</h3>
            <div className="mt-2 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {registration.guest_name || "-"}</p>
              <p><span className="text-muted-foreground">Email:</span> {registration.guest_email || "-"}</p>
              <p><span className="text-muted-foreground">Phone:</span> {registration.guest_phone || "-"}</p>
              <p><span className="text-muted-foreground">Registered:</span> {new Date(registration.registered_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-sm font-semibold text-brand-forest">Status</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                registration.status === "confirmed" ? "bg-green-100 text-green-700"
                : registration.status === "cancelled" ? "bg-red-100 text-red-700"
                : registration.status === "attended" ? "bg-emerald-100 text-emerald-700"
                : registration.status === "waitlisted" ? "bg-gray-100 text-gray-700"
                : registration.status.includes("payment") ? "bg-blue-100 text-blue-700"
                : "bg-yellow-100 text-yellow-700"
              }`}>
                {WORKSHOP_REGISTRATION_STATUS_LABELS[registration.status as keyof typeof WORKSHOP_REGISTRATION_STATUS_LABELS] || registration.status}
              </span>
              {registration.payment_status !== "none" && (
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  registration.payment_status === "verified" ? "bg-green-100 text-green-700"
                  : registration.payment_status === "submitted" ? "bg-blue-100 text-blue-700"
                  : registration.payment_status === "rejected" ? "bg-red-100 text-red-700"
                  : "bg-orange-100 text-orange-700"
                }`}>
                  {WORKSHOP_PAYMENT_STATUS_LABELS[registration.payment_status as keyof typeof WORKSHOP_PAYMENT_STATUS_LABELS] || registration.payment_status}
                </span>
              )}
            </div>
          </div>

          {/* Payment Proof */}
          {latestPayment && (
            <div>
              <h3 className="text-sm font-semibold text-brand-forest">Payment</h3>
              <div className="mt-2 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Amount:</span> Rs. {latestPayment.amount.toLocaleString()}</p>
                {latestPayment.transaction_ref && (
                  <p><span className="text-muted-foreground">Transaction Ref:</span> {latestPayment.transaction_ref}</p>
                )}
                {latestPayment.rejection_reason && (
                  <p className="text-red-600"><span className="text-muted-foreground">Rejection Reason:</span> {latestPayment.rejection_reason}</p>
                )}
                {latestPayment.proof_url && (
                  <div>
                    <button
                      onClick={() => { setSelectedProof(latestPayment.proof_url); setProofModalOpen(true) }}
                      className="inline-flex items-center gap-1 text-brand-terracotta hover:underline"
                    >
                      View Payment Proof <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Online Access */}
          {registration.status === "confirmed" && workshopFormat !== "in_person" && registration.workshop?.online_meeting_url && (
            <div>
              <h3 className="text-sm font-semibold text-brand-forest">Meeting Link</h3>
              <a
                href={registration.workshop.online_meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-brand-terracotta hover:underline"
              >
                Open Meeting Link <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <h3 className="text-sm font-semibold text-brand-forest">Admin Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-forest"
              placeholder="Add internal notes..."
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              {savingNotes ? "Saving..." : "Save Notes"}
            </button>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-sm font-semibold text-brand-forest">Actions</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {hasSubmittedPayment && (
                <>
                  <button
                    onClick={() => onAction(registration.id, "approve_payment")}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                    Approve Payment
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Rejection reason:")
                      if (reason !== null) onAction(registration.id, "reject_payment", reason)
                    }}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="h-3 w-3" />
                    Reject Payment
                  </button>
                </>
              )}
              {registration.status === "confirmed" && (
                <button
                  onClick={() => onAction(registration.id, "attended")}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <UserCheck className="h-3 w-3" />
                  Mark Attended
                </button>
              )}
              {registration.status === "confirmed" && (
                <button
                  onClick={() => onAction(registration.id, "no_show")}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  <UserX className="h-3 w-3" />
                  Mark No Show
                </button>
              )}
              {!["cancelled", "attended", "completed"].includes(registration.status) && (
                <button
                  onClick={() => {
                    const reason = prompt("Cancellation reason (optional):")
                    onAction(registration.id, "cancelled", reason || undefined)
                  }}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
                >
                  <Ban className="h-3 w-3" />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Proof image modal */}
      {proofModalOpen && selectedProof && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setProofModalOpen(false)}>
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setProofModalOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
            <Image
              src={selectedProof}
              alt="Payment proof"
              width={800}
              height={600}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}
