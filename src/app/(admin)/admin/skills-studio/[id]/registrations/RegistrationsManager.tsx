"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, Search, Filter, Download, Loader2, Eye, CheckCircle, XCircle, Clock, UserX, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { WORKSHOP_REGISTRATION_STATUS_LABELS, WORKSHOP_PAYMENT_STATUS_LABELS } from "@/lib/constants"
import RegistrationDetail from "./RegistrationDetail"

interface Registration {
  id: string
  workshop_id: string
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
    date_start: string | null
    online_meeting_url: string | null
    location_address: string | null
  } | null
  payments: {
    id: string
    amount: number
    status: string
    proof_url: string | null
    transaction_ref: string | null
  }[]
}

interface Props {
  workshopId: string
  workshopTitle: string
  workshopFee: number
  workshopFormat: string
}

export default function RegistrationsManager({ workshopId, workshopTitle, workshopFee, workshopFormat }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("")
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchRegistrations = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ workshopId, limit: "100" })
    if (search) params.set("search", search)
    if (statusFilter) params.set("status", statusFilter)
    if (paymentFilter) params.set("paymentStatus", paymentFilter)

    try {
      const res = await fetch(`/api/admin/workshop-registrations?${params}`)
      const data = await res.json()
      if (res.ok) {
        setRegistrations(data.registrations)
        setTotal(data.total)
      }
    } catch {
      toast.error("Failed to load registrations")
    } finally {
      setLoading(false)
    }
  }, [workshopId, search, statusFilter, paymentFilter])

  useEffect(() => {
    fetchRegistrations()
  }, [fetchRegistrations])

  const handleAction = async (registrationId: string, action: string, reason?: string) => {
    setActionLoading(registrationId)
    try {
      let res
      if (action === "approve_payment") {
        res = await fetch(`/api/admin/workshop-registrations/${registrationId}/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        })
      } else if (action === "reject_payment") {
        res = await fetch(`/api/admin/workshop-registrations/${registrationId}/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject", reason: reason || "Payment could not be verified" }),
        })
      } else {
        res = await fetch(`/api/admin/workshop-registrations/${registrationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action, cancellationReason: reason }),
        })
      }

      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || "Updated successfully")
        fetchRegistrations()
        setSelectedRegistration(null)
      } else {
        toast.error(data.error || "Action failed")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setActionLoading(null)
    }
  }

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Status", "Payment Status", "Registered", "Notes"]
    const rows = registrations.map((r) => [
      r.guest_name || "",
      r.guest_email || "",
      r.guest_phone || "",
      r.status,
      r.payment_status,
      new Date(r.registered_at).toLocaleDateString(),
      r.admin_notes || "",
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${workshopTitle.replace(/\s+/g, "_")}_registrations.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusCounts = registrations.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      <Link href="/admin/skills-studio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Back to Skills Studio
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {workshopTitle} — {total} registration{total !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Status summary */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <span key={status} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {WORKSHOP_REGISTRATION_STATUS_LABELS[status as keyof typeof WORKSHOP_REGISTRATION_STATUS_LABELS] || status}: {count}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-forest"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-forest"
        >
          <option value="">All Statuses</option>
          {Object.entries(WORKSHOP_REGISTRATION_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-forest"
        >
          <option value="">All Payment</option>
          {Object.entries(WORKSHOP_PAYMENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : registrations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No registrations found.</td>
              </tr>
            ) : (
              registrations.map((reg) => {
                const latestPayment = reg.payments?.find((p) => p.status === "submitted")
                return (
                  <tr key={reg.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{reg.guest_name || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{reg.guest_email || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{reg.guest_phone || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        reg.status === "confirmed" ? "bg-green-100 text-green-700"
                        : reg.status === "cancelled" ? "bg-red-100 text-red-700"
                        : reg.status === "attended" ? "bg-emerald-100 text-emerald-700"
                        : reg.status === "waitlisted" ? "bg-gray-100 text-gray-700"
                        : reg.status.includes("payment") ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {WORKSHOP_REGISTRATION_STATUS_LABELS[reg.status as keyof typeof WORKSHOP_REGISTRATION_STATUS_LABELS] || reg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        reg.payment_status === "verified" ? "bg-green-100 text-green-700"
                        : reg.payment_status === "submitted" ? "bg-blue-100 text-blue-700"
                        : reg.payment_status === "rejected" ? "bg-red-100 text-red-700"
                        : reg.payment_status === "awaiting" ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-600"
                      }`}>
                        {WORKSHOP_PAYMENT_STATUS_LABELS[reg.payment_status as keyof typeof WORKSHOP_PAYMENT_STATUS_LABELS] || reg.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(reg.registered_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedRegistration(reg)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {reg.status === "payment_submitted" && workshopFee > 0 && (
                          <>
                            <button
                              onClick={() => handleAction(reg.id, "approve_payment")}
                              disabled={actionLoading === reg.id}
                              className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-50"
                              title="Approve payment"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt("Rejection reason:")
                                if (reason !== null) handleAction(reg.id, "reject_payment", reason)
                              }}
                              disabled={actionLoading === reg.id}
                              className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                              title="Reject payment"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {reg.status === "confirmed" && (
                          <button
                            onClick={() => handleAction(reg.id, "attended")}
                            disabled={actionLoading === reg.id}
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                            title="Mark as attended"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail slide-over */}
      {selectedRegistration && (
        <RegistrationDetail
          registration={selectedRegistration}
          workshopFee={workshopFee}
          workshopFormat={workshopFormat}
          onClose={() => setSelectedRegistration(null)}
          onAction={handleAction}
          actionLoading={actionLoading === selectedRegistration.id}
        />
      )}
    </div>
  )
}
