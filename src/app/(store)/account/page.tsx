"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Package, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AccountOverviewPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      if (prof) setProfile(prof)

      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)
      if (orders) setRecentOrders(orders)

      setLoading(false)
    }
    fetch()
  }, [supabase])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border p-6">
        <h2 className="font-heading text-xl font-bold text-brand-forest">
          Welcome back, {profile?.full_name || "Customer"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{profile?.email}</p>
        {profile?.phone && (
          <p className="text-sm text-muted-foreground">{profile.phone}</p>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-brand-forest">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm text-brand-forest underline underline-offset-2">
            View All
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-xl border border-border p-8 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No orders yet</p>
            <Link href="/shop" className="mt-3 inline-block rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
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
        )}
      </div>
    </div>
  )
}
