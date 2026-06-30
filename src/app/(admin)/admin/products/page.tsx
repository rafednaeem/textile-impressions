"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Search, MoreHorizontal, Copy, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toggleProductActive, duplicateProduct, deleteProduct } from "@/lib/admin/actions"

export default function AdminProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const fetchProducts = async () => {
    setLoading(true)
    let query = supabase
      .from("products")
      .select("*, categories(name), product_images(*)")

    if (categoryFilter) query = query.eq("category_id", categoryFilter)
    if (search) query = query.ilike("name", `%${search}%`)

    const { data } = await query.order("created_at", { ascending: false }).limit(100)
    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
    supabase.from("categories").select("*").order("name").then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [search, categoryFilter])

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleProductActive(id, !isActive)
    fetchProducts()
  }

  const handleDuplicate = async (id: string) => {
    await duplicateProduct(id)
    fetchProducts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    await deleteProduct(id)
    fetchProducts()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-brand-forest">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-1 rounded-full bg-brand-forest px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-brand-forest focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">No products found</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const primaryImage = product.product_images?.find((img: any) => img.is_primary) || product.product_images?.[0]
                return (
                  <tr key={product.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${product.id}/edit`} className="flex items-center gap-3">
                        {primaryImage ? (
                          <Image src={primaryImage.url} alt={product.name} width={40} height={54} className="rounded object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">No img</div>
                        )}
                        <span className="font-medium hover:text-brand-forest">{product.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{product.categories?.name || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {product.sale_price ? (
                        <span className="text-red-600">Rs. {Number(product.sale_price).toLocaleString()}</span>
                      ) : (
                        <span>Rs. {Number(product.price).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={product.inventory_count < 5 ? "text-red-600 font-medium" : ""}>
                        {product.inventory_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center relative">
                      <button onClick={() => setOpenMenu(openMenu === product.id ? null : product.id)} className="p-1 hover:bg-muted rounded">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {openMenu === product.id && (
                        <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-border bg-card p-1 shadow-lg">
                          <Link href={`/admin/products/${product.id}/edit`} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">Edit</Link>
                          <button onClick={() => { handleDuplicate(product.id); setOpenMenu(null) }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
                            <Copy className="h-3.5 w-3.5" /> Duplicate
                          </button>
                          <button onClick={() => { handleToggle(product.id, product.is_active); setOpenMenu(null) }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
                            {product.is_active ? <ToggleLeft className="h-3.5 w-3.5" /> : <ToggleRight className="h-3.5 w-3.5" />}
                            {product.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button onClick={() => { handleDelete(product.id); setOpenMenu(null) }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}
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
