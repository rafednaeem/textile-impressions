"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useEffect, useState, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { SlidersHorizontal, ChevronDown, ChevronRight, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Product, Category } from "@/types/database"
import ProductCard from "@/components/store/ProductCard"

const PAGE_SIZE = 12

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Featured", value: "featured" },
] as const

interface CategoryGroup {
  parent: Category
  children: Category[]
}

export default function ShopContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const categorySlug = searchParams.get("category") || ""
  const sort = searchParams.get("sort") || "newest"
  const minPrice = searchParams.get("min") || ""
  const maxPrice = searchParams.get("max") || ""
  const page = parseInt(searchParams.get("page") || "1", 10)

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) {
          setCategories(data)
          const parentIds = data.filter((c) => !c.parent_id).map((c) => c.id)
          setExpandedGroups(new Set(parentIds))
        }
      })
  }, [supabase])

  const categoryGroups = useMemo(() => {
    const parents = categories.filter((c) => !c.parent_id)
    const children = categories.filter((c) => c.parent_id)
    return parents.map((parent) => ({
      parent,
      children: children.filter((c) => c.parent_id === parent.id),
    }))
  }, [categories])

  const orphans = useMemo(() => {
    const parentIds = new Set(categories.filter((c) => !c.parent_id).map((c) => c.id))
    const childIds = new Set(categories.filter((c) => c.parent_id).map((c) => c.parent_id))
    return categories.filter((c) => !c.parent_id && !childIds.has(c.id))
  }, [categories])

  const selectedCategory = categories.find((c) => c.slug === categorySlug)
  const selectedParentId = selectedCategory?.parent_id || (selectedCategory && !selectedCategory.parent_id ? selectedCategory.id : null)

  const toggleGroup = (parentId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(parentId)) next.delete(parentId)
      else next.add(parentId)
      return next
    })
  }

  const getFilteredCategoryIds = useCallback(() => {
    if (!categorySlug) return null

    const cat = categories.find((c) => c.slug === categorySlug)
    if (!cat) return null

    if (!cat.parent_id) {
      const childIds = categories.filter((c) => c.parent_id === cat.id).map((c) => c.id)
      return [cat.id, ...childIds]
    }

    return [cat.id]
  }, [categorySlug, categories])

  const buildQuery = useCallback(() => {
    let query = supabase
      .from("products")
      .select("*, product_images(*)", { count: "exact" })
      .eq("is_active", true)

    const filteredIds = getFilteredCategoryIds()
    if (filteredIds) {
      query = query.in("category_id", filteredIds)
    }

    if (minPrice) {
      const priceCol = `COALESCE(sale_price, price)`
      query = query.gte(priceCol, parseFloat(minPrice))
    }
    if (maxPrice) {
      const priceCol = `COALESCE(sale_price, price)`
      query = query.lte(priceCol, parseFloat(maxPrice))
    }

    switch (sort) {
      case "price_asc":
        query = query.order("sale_price", { ascending: true, nullsFirst: false }).order("price", { ascending: true })
        break
      case "price_desc":
        query = query.order("sale_price", { ascending: false, nullsFirst: true }).order("price", { ascending: false })
        break
      case "featured":
        query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false })
        break
      default:
        query = query.order("created_at", { ascending: false })
    }

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    query = query.range(from, to)

    return query
  }, [categorySlug, sort, minPrice, maxPrice, page, supabase, getFilteredCategoryIds])

  useEffect(() => {
    setLoading(true)
    const q = buildQuery()
    q.then(({ data, count: total }) => {
      if (data) {
        setProducts(data as unknown as Product[])
        setCount(total ?? 0)
      }
      setLoading(false)
    })
  }, [buildQuery])

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== "page") params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  const totalPages = Math.ceil(count / PAGE_SIZE)
  const hasFilters = categorySlug || minPrice || maxPrice

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-brand-forest">
            {categorySlug
              ? categories.find((c) => c.slug === categorySlug)?.name || "Shop"
              : "Shop All"}
          </h1>
          {!loading && <p className="text-sm text-muted-foreground">{count} products</p>}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="appearance-none rounded-full border border-border bg-background px-4 py-2 pr-8 text-sm font-medium transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-brand-forest"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className={`shrink-0 lg:block ${showFilters ? "fixed inset-0 z-40 overflow-y-auto bg-background p-6" : "hidden"} w-full lg:relative lg:w-60`}>
          <div className="flex items-center justify-between lg:hidden">
            <h2 className="font-heading text-lg font-bold text-brand-forest">Filters</h2>
            <button onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Categories</h3>
              <ul className="space-y-0.5">
                <li>
                  <button onClick={() => setParam("category", "")}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${!categorySlug ? "bg-brand-forest text-white" : "hover:bg-muted"}`}
                  >All Products</button>
                </li>

                {categoryGroups.map((group) => {
                  const isExpanded = expandedGroups.has(group.parent.id)
                  const isParentSelected = categorySlug === group.parent.slug
                  const hasSelectedChild = group.children.some((c) => c.slug === categorySlug)

                  return (
                    <li key={group.parent.id}>
                      <div className="flex items-center">
                        <button
                          onClick={() => setParam("category", group.parent.slug)}
                          className={`flex-1 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                            isParentSelected ? "bg-brand-forest text-white" : "hover:bg-muted"
                          }`}
                        >
                          {group.parent.name}
                        </button>
                        {group.children.length > 0 && (
                          <button
                            onClick={() => toggleGroup(group.parent.id)}
                            className={`p-1 rounded transition-colors ${isParentSelected || hasSelectedChild ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </button>
                        )}
                      </div>
                      {isExpanded && group.children.length > 0 && (
                        <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-3">
                          {group.children.map((child) => (
                            <li key={child.id}>
                              <button onClick={() => setParam("category", child.slug)}
                                className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                                  categorySlug === child.slug
                                    ? "bg-brand-terracotta text-white font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                              >{child.name}</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}

                {orphans.map((cat) => (
                  <li key={cat.id}>
                    <button onClick={() => setParam("category", cat.slug)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${categorySlug === cat.slug ? "bg-brand-forest text-white" : "hover:bg-muted"}`}
                    >{cat.name}</button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Price Range</h3>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setParam("min", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest" />
                <span className="text-muted-foreground">-</span>
                <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setParam("max", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest" />
              </div>
            </div>
          </div>
          {hasFilters && (
            <button onClick={clearFilters}
              className="mt-6 w-full rounded-full border border-border py-2 text-sm font-medium transition-colors hover:bg-muted"
            >Clear All Filters</button>
          )}
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-xl bg-muted" />
                  <div className="mt-3 space-y-2 px-1">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-4 w-1/3 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 text-center"
              data-testid="shop-empty-state"
            >
              <div className="rounded-full bg-muted p-4">
                <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-heading text-xl font-bold text-brand-forest">No products found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or browse all products.</p>
              {hasFilters && (
                <button onClick={clearFilters}
                  className="mt-4 rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-forest/90"
                >Clear Filters</button>
              )}
            </div>
          ) : (
            <>
              <motion.div initial="initial" animate="animate" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setParam("page", String(p))}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-brand-forest text-white" : "border border-border hover:bg-muted"}`}
                    >{p}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

