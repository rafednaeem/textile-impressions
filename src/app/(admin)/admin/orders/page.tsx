"use client"

export const dynamic = "force-dynamic"

import { Suspense, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search, ChevronRight, Filter } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const STATUSES = [
  "pending", "payment_pending", "payment_submitted", "payment_verified",
  "processing", "shipped", "delivered", "cancelled",
]

const PAYMENT_METHODS = ["bank_transfer", "easypaisa", "jazzcash", "whatsapp"]

function AdminOrdersContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [paymentFilter, setPaymentFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from("orders")
      .select("*, payments(*), profiles!orders_user_id_fkey(full_name, email)")

    if (statusFilter) query = query.eq("status", statusFilter)
    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,profiles.full_name.ilike.%${search}%`
      )
    }

    if (paymentFilter) {
      query = query.eq("payments.method", paymentFilter)
    }

    const { data } = await query.order("created_at", { ascending: false }).limit(100)
    if (data) setOrders(data)
    setLoading(false)
  }, [supabase, statusFilter, search, paymentFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-brand-forest">Orders</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-brand-forest focus:outline-none"
          />
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Payment Method</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none"
            >
              <option value="">All Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Order #</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Payment</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">#{order.order_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.profiles?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{order.profiles?.email || ""}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    Rs. {Number(order.total).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      order.status === "delivered" ? "bg-green-100 text-green-700"
                      : order.status === "cancelled" ? "bg-red-100 text-red-700"
                      : order.status === "shipped" ? "bg-blue-100 text-blue-700"
                      : order.status === "payment_submitted" ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-700"
                    }`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      order.payments?.[0]?.status === "verified" ? "bg-green-100 text-green-700"
                      : order.payments?.[0]?.status === "rejected" ? "bg-red-100 text-red-700"
                      : order.payments?.[0]?.status === "submitted" ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-700"
                    }`}>
                      {order.payments?.[0]?.status || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-brand-forest hover:underline"
                    >
                      View <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted" />)}</div>}>
      <AdminOrdersContent />
    </Suspense>
  )
}
