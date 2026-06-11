"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { Search, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AdminCustomersPage() {
  const supabase = createClient()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [customerDetails, setCustomerDetails] = useState<Record<string, any>>({})

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("role", "customer")

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data } = await query.order("created_at", { ascending: false })
      if (data) {
        const withStats = await Promise.all(
          data.map(async (c: any) => {
            const { count: orderCount } = await supabase
              .from("orders")
              .select("*", { count: "exact", head: true })
              .eq("user_id", c.id)

            const { data: spentData } = await supabase
              .from("orders")
              .select("total")
              .eq("user_id", c.id)
              .eq("status", "delivered")

            const totalSpent = (spentData || []).reduce((s: number, o: any) => s + Number(o.total), 0)

            return { ...c, order_count: orderCount || 0, total_spent: totalSpent }
          })
        )
        setCustomers(withStats)
      }
      setLoading(false)
    }
    fetch()
  }, [supabase, search])

  const expandCustomer = async (id: string) => {
    if (expanded === id) {
      setExpanded(null)
      return
    }
    setExpanded(id)

    if (!customerDetails[id]) {
      const [ordersRes, addressesRes] = await Promise.all([
        supabase.from("orders").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(10),
        supabase.from("addresses").select("*").eq("user_id", id),
      ])
      setCustomerDetails((prev) => ({
        ...prev,
        [id]: { orders: ordersRes.data || [], addresses: addressesRes.data || [] },
      }))
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-muted" />
      ))}
    </div>
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-brand-forest">Customers</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-brand-forest focus:outline-none"
        />
      </div>

      {customers.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">No customers found</div>
      ) : (
        <div className="space-y-2">
          {customers.map((customer) => (
            <div key={customer.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => expandCustomer(customer.id)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-rose text-sm font-bold text-white">
                    {customer.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{customer.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="font-medium">{customer.order_count}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Rs. {customer.total_spent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Spent</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {new Date(customer.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded === customer.id ? "rotate-180" : ""}`} />
                </div>
              </button>

              {expanded === customer.id && (
                <div className="border-t border-border p-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Order History</h3>
                    {customerDetails[customer.id]?.orders?.length ? (
                      <div className="space-y-2">
                        {customerDetails[customer.id].orders.map((order: any) => (
                          <div key={order.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3 text-sm">
                            <span className="font-medium">#{order.order_number}</span>
                            <span className="text-muted-foreground">Rs. {Number(order.total).toLocaleString()}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                              order.status === "delivered" ? "bg-green-100 text-green-700"
                              : order.status === "cancelled" ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                            }`}>{order.status.replace("_", " ")}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No orders yet</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">Saved Addresses</h3>
                    {customerDetails[customer.id]?.addresses?.length ? (
                      <div className="space-y-2">
                        {customerDetails[customer.id].addresses.map((addr: any) => (
                          <div key={addr.id} className="rounded-lg bg-muted/30 p-3 text-sm">
                            <p className="font-medium">{addr.full_name}</p>
                            <p className="text-muted-foreground">{addr.phone}</p>
                            <p className="text-muted-foreground">{addr.address_line1}, {addr.city}, {addr.province}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No saved addresses</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
