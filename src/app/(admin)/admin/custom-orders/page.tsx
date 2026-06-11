"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const statuses = ["new", "contacted", "in_progress", "completed", "cancelled"]

export default function AdminCustomOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])

  const fetchOrders = async () => {
    const { data } = await supabase.from("custom_orders").select("*").order("created_at", { ascending: false })
    if (data) setOrders(data)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("custom_orders").update({ status }).eq("id", id)
    fetchOrders()
  }

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold text-brand-forest">Custom Orders</h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{order.name} - {order.garment_type}</p>
                <p className="text-sm text-muted-foreground">{order.phone} | Budget: {order.budget_range || "Not specified"} | Deadline: {order.deadline || "Flexible"}</p>
              </div>
              <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{order.notes || "No notes provided."}</p>
            {order.reference_images?.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">Reference files: {order.reference_images.join(", ")}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
