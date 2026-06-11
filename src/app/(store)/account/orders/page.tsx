"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Package, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function OrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (data) setOrders(data)
      setLoading(false)
    }
    fetch()
  }, [supabase])

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-border p-12 text-center">
        <Package className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-3 font-heading text-xl font-bold text-brand-forest">No orders yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your order history will appear here.
        </p>
        <Link
          href="/shop"
          className="mt-4 inline-block rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="font-heading text-xl font-bold text-brand-forest">Order History</h2>
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/account/orders/${order.id}`}
          className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
        >
          <div>
            <p className="text-sm font-medium">#{order.order_number}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              Rs. {order.total.toLocaleString()} — {order.order_items?.length || 0} items
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-0.5 text-xs font-medium capitalize ${
              order.status === "delivered" ? "bg-green-100 text-green-700"
              : order.status === "cancelled" ? "bg-red-100 text-red-700"
              : order.status === "shipped" ? "bg-blue-100 text-blue-700"
              : "bg-amber-100 text-amber-700"
            }`}>
              {order.status.replace("_", " ")}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  )
}
