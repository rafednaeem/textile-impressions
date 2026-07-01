"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DollarSign, ShoppingBag, Clock, AlertTriangle, ArrowRight, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

export default function AdminDashboard() {
  const supabase = createClient()
  const [kpi, setKpi] = useState({ revenue: 0, orders: 0, pendingPayments: 0, lowStock: 0 })
  const [ordersPerDay, setOrdersPerDay] = useState<any[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data: deliveredOrders } = await supabase
        .from("orders")
        .select("total")
        .eq("status", "delivered")
        .gte("created_at", thirtyDaysAgo)

      const revenue = (deliveredOrders || []).reduce((sum: number, o: any) => sum + Number(o.total), 0)

      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo)

      const { count: pendingCount } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "submitted")

      const { count: lowStockCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .lt("inventory_count", 5)
        .gt("inventory_count", 0)

      setKpi({ revenue, orders: ordersCount || 0, pendingPayments: pendingCount || 0, lowStock: lowStockCount || 0 })

      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      const { data: recentOrders } = await supabase
        .from("orders")
        .select("created_at, total")
        .gte("created_at", fourteenDaysAgo)
        .order("created_at", { ascending: true })

      const dayMap: Record<string, any> = {}
      for (let i = 0; i < 14; i++) {
        const d = new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000)
        const key = d.toISOString().slice(0, 10)
        dayMap[key] = { date: key.slice(5), orders: 0 }
      }
      for (const o of recentOrders || []) {
        const key = o.created_at.slice(0, 10)
        if (dayMap[key]) dayMap[key].orders++
      }
      setOrdersPerDay(Object.values(dayMap))

      setLoading(false)
    }
    fetch()
  }, [supabase])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-72 rounded-xl bg-muted" />
      </div>
    )
  }

  const kpiCards = [
    {
      label: "Total Revenue (30d)",
      value: `Rs. ${kpi.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: "Total Orders (30d)",
      value: kpi.orders.toString(),
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Pending Payments",
      value: kpi.pendingPayments.toString(),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Low Stock Items",
      value: kpi.lowStock.toString(),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-100",
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-brand-forest">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Orders Per Day (Last 14 Days)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={ordersPerDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            />
            <Line type="monotone" dataKey="orders" stroke="#1a3a2a" strokeWidth={2} dot={{ fill: "#1a3a2a" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/orders?status=payment_submitted" className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Verify Pending Payments</p>
              <p className="text-xs text-muted-foreground">{kpi.pendingPayments} payments to review</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link href="/admin/orders?status=payment_verified" className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Orders Requiring Processing</p>
              <p className="text-xs text-muted-foreground">Move verified orders to processing</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  )
}
