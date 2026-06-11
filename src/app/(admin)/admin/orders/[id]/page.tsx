"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, CheckCircle, XCircle, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { verifyPayment, rejectPayment, updateOrderStatus } from "@/lib/admin/actions"

const STATUSES = [
  "pending", "payment_pending", "payment_submitted", "payment_verified",
  "processing", "shipped", "delivered", "cancelled",
]

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const supabase = createClient()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [enlargeImage, setEnlargeImage] = useState<string | null>(null)

  const fetchOrder = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*), payments(*), order_timeline(*, profiles!order_timeline_created_by_fkey(full_name)), profiles!orders_user_id_fkey(full_name, email, phone)")
      .eq("id", id)
      .single()
    if (data) setOrder(data)
    setLoading(false)
  }

  useEffect(() => { fetchOrder() }, [id, supabase])

  const handleVerify = async () => {
    setStatusUpdating(true)
    await verifyPayment(id)
    await fetchOrder()
    setStatusUpdating(false)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    setStatusUpdating(true)
    await rejectPayment(id, rejectReason)
    await fetchOrder()
    setShowRejectInput(false)
    setRejectReason("")
    setStatusUpdating(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true)
    await updateOrderStatus(id, newStatus)
    await fetchOrder()
    setStatusUpdating(false)
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-64 rounded-xl bg-muted" />
      <div className="h-48 rounded-xl bg-muted" />
    </div>
  }

  if (!order) {
    return <div className="py-20 text-center text-muted-foreground">Order not found</div>
  }

  const addr = order.shipping_address || {}
  const payment = order.payments?.[0]
  const timeline = order.order_timeline || []

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-forest">Order #{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleDateString("en-GB", {
              day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-4 py-1 text-sm font-medium capitalize ${
            order.status === "delivered" ? "bg-green-100 text-green-700"
            : order.status === "cancelled" ? "bg-red-100 text-red-700"
            : order.status === "shipped" ? "bg-blue-100 text-blue-700"
            : order.status === "payment_submitted" ? "bg-amber-100 text-amber-700"
            : "bg-gray-100 text-gray-700"
          }`}>
            {order.status.replace("_", " ")}
          </span>
          <div className="relative">
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusUpdating}
              className="appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm focus:border-brand-forest focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-brand-forest">Customer</h3>
          <p className="mt-2 text-sm font-medium">{order.profiles?.full_name || "Unknown"}</p>
          <p className="text-sm text-muted-foreground">{order.profiles?.email}</p>
          <p className="text-sm text-muted-foreground">{order.profiles?.phone || order.shipping_address?.phone}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-brand-forest">Shipping Address</h3>
          <p className="mt-2 text-sm font-medium">{addr.full_name}</p>
          <p className="text-sm text-muted-foreground">
            {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}<br />
            {addr.city}, {addr.province}{addr.postal_code ? ` - ${addr.postal_code}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">{addr.phone}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-brand-forest">Order Summary</h3>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>Rs. {Number(order.subtotal).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{Number(order.shipping_cost) === 0 ? "Free" : `Rs. ${Number(order.shipping_cost).toLocaleString()}`}</span></div>
            <div className="flex justify-between border-t border-border pt-1 font-medium"><span>Total</span><span className="text-brand-forest">Rs. {Number(order.total).toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-brand-forest">Items</h3>
        <div className="mt-3 divide-y divide-border">
          {(order.order_items || []).map((item: any) => (
            <div key={item.id} className="flex items-center gap-4 py-3">
              {item.product_image && (
                <Image src={item.product_image} alt={item.product_name} width={48} height={64} className="rounded-md object-cover" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">
                  {[item.size, item.color].filter(Boolean).join(" / ")} — Qty: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium">Rs. {Number(item.total_price).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {payment && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-brand-forest">Payment</h3>
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <div><span className="text-muted-foreground">Method:</span> <span className="font-medium capitalize">{payment.method.replace("_", " ")}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className={`font-medium capitalize ${
                payment.status === "verified" ? "text-green-600" : payment.status === "rejected" ? "text-red-600" : ""
              }`}>{payment.status}</span></div>
              {payment.transaction_reference && (
                <div><span className="text-muted-foreground">Reference:</span> <span className="font-medium">{payment.transaction_reference}</span></div>
              )}
              {payment.rejection_reason && (
                <div><span className="text-muted-foreground">Rejection reason:</span> <span className="font-medium text-red-600">{payment.rejection_reason}</span></div>
              )}
            </div>

            {payment.proof_url && (
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Payment Proof:</p>
                <button onClick={() => setEnlargeImage(payment.proof_url)} className="group relative overflow-hidden rounded-lg border border-border">
                  <Image src={payment.proof_url} alt="Payment proof" width={200} height={280} className="object-cover transition-transform group-hover:scale-105" />
                </button>
              </div>
            )}

            {(payment.status === "submitted" || payment.status === "pending") && (
              <div className="flex gap-3">
                <button
                  onClick={handleVerify}
                  disabled={statusUpdating}
                  className="flex items-center gap-1 rounded-full bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" /> Verify Payment
                </button>
                <button
                  onClick={() => setShowRejectInput(!showRejectInput)}
                  className="flex items-center gap-1 rounded-full border border-red-300 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" /> Reject Payment
                </button>
              </div>
            )}

            {showRejectInput && (
              <div className="flex gap-2">
                <input
                  placeholder="Rejection reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-brand-forest focus:outline-none"
                />
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || statusUpdating}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {timeline.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-brand-forest">Timeline</h3>
          <div className="mt-3 space-y-3">
            {timeline.map((entry: any) => (
              <div key={entry.id} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-forest" />
                  <div className="h-full w-px bg-border" />
                </div>
                <div>
                  <p className="font-medium capitalize">{entry.status.replace("_", " ")}</p>
                  {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                  <p className="text-xs text-muted-foreground">
                    {entry.profiles?.full_name ? `${entry.profiles.full_name} — ` : ""}
                    {new Date(entry.created_at).toLocaleString("en-GB", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {enlargeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEnlargeImage(null)}>
          <Image src={enlargeImage} alt="Payment proof" width={600} height={800} className="max-h-[90vh] rounded-lg object-contain" />
        </div>
      )}
    </div>
  )
}
