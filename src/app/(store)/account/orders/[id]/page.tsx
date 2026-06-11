"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ChevronLeft, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const supabase = createClient()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*), payments(*), order_timeline(*)")
        .eq("id", id)
        .single()
      if (data) setOrder(data)
      setLoading(false)
    }
    fetch()
  }, [id, supabase])

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-48 rounded bg-muted" /><div className="h-64 rounded-xl bg-muted" /></div>
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <Package className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-3 font-heading text-xl font-bold text-brand-forest">Order not found</h2>
        <Link href="/account/orders" className="mt-4 inline-block text-sm text-brand-forest underline">
          Back to Orders
        </Link>
      </div>
    )
  }

  const addr = order.shipping_address || {}
  const timeline = order.order_timeline || []

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-brand-forest">
            Order #{order.order_number}
          </h2>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleDateString("en-GB", {
              day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <span className={`rounded-full px-4 py-1 text-sm font-medium capitalize ${
          order.status === "delivered" ? "bg-green-100 text-green-700"
          : order.status === "cancelled" ? "bg-red-100 text-red-700"
          : order.status === "shipped" ? "bg-blue-100 text-blue-700"
          : "bg-amber-100 text-amber-700"
        }`}>
          {order.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-brand-forest">Shipping Address</h3>
          <p className="mt-2 text-sm">{addr.full_name}</p>
          <p className="text-sm text-muted-foreground">
            {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}<br />
            {addr.city}, {addr.province}{addr.postal_code ? ` - ${addr.postal_code}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">{addr.phone}</p>
        </div>

        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-brand-forest">Order Summary</h3>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>Rs. {order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping_cost === 0 ? "Free" : `Rs. ${order.shipping_cost}`}</span></div>
            <div className="flex justify-between border-t border-border pt-1 font-medium"><span>Total</span><span className="text-brand-forest">Rs. {order.total.toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {order.payments?.[0] && (
        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-brand-forest">Payment</h3>
          <p className="mt-1 text-sm capitalize">Method: {order.payments[0].method.replace("_", " ")}</p>
          <p className="text-sm capitalize">Status: {order.payments[0].status}</p>
          {order.payments[0].rejection_reason && (
            <p className="text-sm text-red-500">Reason: {order.payments[0].rejection_reason}</p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-brand-forest">Items</h3>
        <div className="mt-3 space-y-3">
          {(order.order_items || []).map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">
                  {[item.size, item.color].filter(Boolean).join(" / ")} — Qty: {item.quantity}
                </p>
              </div>
              <p className="font-medium">Rs. {item.total_price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {timeline.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-brand-forest">Timeline</h3>
          <div className="mt-3 space-y-3">
            {timeline.map((entry: any) => (
              <div key={entry.id} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-brand-forest" />
                  <div className="h-full w-px bg-border" />
                </div>
                <div>
                  <p className="font-medium capitalize">{entry.status.replace("_", " ")}</p>
                  {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                  <p className="text-xs text-muted-foreground">
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
    </div>
  )
}
