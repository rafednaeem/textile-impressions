"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { Search, ArrowUpDown, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { updateInventory, bulkUpdateInventory } from "@/lib/admin/actions"

export default function AdminInventoryPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortAsc, setSortAsc] = useState(true)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [selectAll, setSelectAll] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkValue, setBulkValue] = useState("")

  const fetchProducts = async () => {
    setLoading(true)
    let query = supabase
      .from("products")
      .select("*, product_variants(*)")

    if (search) query = query.ilike("name", `%${search}%`)

    query = query.order("inventory_count", { ascending: sortAsc })

    const { data } = await query
    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [search, sortAsc])

  const handleSave = async (id: string) => {
    const count = parseInt(editing[id])
    if (isNaN(count) || count < 0) return
    await updateInventory(id, count)
    setEditing((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    fetchProducts()
  }

  const handleBulkUpdate = async () => {
    const count = parseInt(bulkValue)
    if (isNaN(count) || count < 0 || selected.size === 0) return
    await bulkUpdateInventory(
      Array.from(selected).map((id) => ({ id, count }))
    )
    setBulkValue("")
    setSelected(new Set())
    setSelectAll(false)
    fetchProducts()
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    if (selectAll) {
      setSelected(new Set(products.map((p) => p.id)))
    } else {
      setSelected(new Set())
    }
  }, [selectAll, products])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-brand-forest">Inventory</h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Stock count"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none"
              />
              <button onClick={handleBulkUpdate} className="rounded-full bg-brand-forest px-4 py-2 text-sm font-medium text-white">
                Update {selected.size} items
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-brand-forest focus:outline-none"
          />
        </div>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          <ArrowUpDown className="h-4 w-4" />
          Stock: {sortAsc ? "Low First" : "High First"}
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">No products found</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={selectAll} onChange={() => setSelectAll(!selectAll)} className="rounded border-border text-brand-forest" />
                </th>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Variants</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const variants = product.product_variants || []
                const totalVariantStock = variants.reduce((s: number, v: any) => s + v.inventory_count, 0)
                const isEditing = editing[product.id] !== undefined
                const displayStock = isEditing ? editing[product.id] : product.inventory_count

                return (
                  <tr key={product.id} className={`hover:bg-muted/30 ${product.inventory_count < 5 ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded border-border text-brand-forest"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {variants.map((v: any) => (
                          <span key={v.id} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                            {[v.size, v.color].filter(Boolean).join("/")}: {v.inventory_count}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={displayStock}
                          onChange={(e) => setEditing({ ...editing, [product.id]: e.target.value })}
                          className="w-20 rounded-lg border border-brand-forest bg-background px-2 py-1 text-right text-sm focus:outline-none"
                          autoFocus
                          onBlur={() => handleSave(product.id)}
                          onKeyDown={(e) => e.key === "Enter" && handleSave(product.id)}
                        />
                      ) : (
                        <button
                          onClick={() => setEditing({ ...editing, [product.id]: product.inventory_count.toString() })}
                          className={`font-medium hover:text-brand-forest ${
                            product.inventory_count < 5 ? "text-red-600" : ""
                          }`}
                        >
                          {product.inventory_count}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setEditing({ ...editing, [product.id]: product.inventory_count.toString() })}
                        className="text-xs text-brand-forest underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
