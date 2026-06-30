"use client"

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { createClient } from "@/lib/supabase/client"
import type { CartItem, Product, ProductVariant } from "@/types/database"

type CartItemDisplay = CartItem & {
  product: Pick<Product, "name" | "slug" | "price" | "sale_price" | "inventory_count">
  image: string | null
  variant?: Pick<ProductVariant, "size" | "color"> | null
}

type AddItemProduct = CartItemDisplay["product"] & { id?: string }

interface CartContextValue {
  items: CartItemDisplay[]
  itemCount: number
  subtotal: number
  sessionId: string
  loading: boolean
  addItem: (params: {
    product: AddItemProduct
    image: string | null
    variant?: CartItemDisplay["variant"] | null
    quantity?: number
  }) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  mergeGuestCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

function generateSessionId(): string {
  if (typeof window === "undefined") return ""
  const existing = sessionStorage.getItem("cart_session_id")
  if (existing) return existing
  const id = crypto.randomUUID()
  sessionStorage.setItem("cart_session_id", id)
  return id
}

function getLocalCart(): CartItemDisplay[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem("guest_cart")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setLocalCart(items: CartItemDisplay[]) {
  sessionStorage.setItem("guest_cart", JSON.stringify(items))
}

function getPrice(product: CartItemDisplay["product"]): number {
  return product.sale_price ?? product.price
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemDisplay[]>([])
  const [sessionId] = useState(generateSessionId)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadDbCart = useCallback(async (userId: string) => {
    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle()

    if (!cart) {
      setItems([])
      return
    }

    const { data: rawItems } = await supabase
      .from("cart_items")
      .select("*, products!inner(name, slug, price, sale_price, inventory_count)")
      .eq("cart_id", cart.id)

    if (rawItems) {
      setItems(
        rawItems.map((ci: any) => ({
          id: ci.id,
          cart_id: ci.cart_id,
          product_id: ci.product_id,
          variant_id: ci.variant_id,
          quantity: ci.quantity,
          price_at_time: ci.price_at_time,
          product: ci.products ?? { name: "Unknown", slug: "", price: 0, sale_price: null, inventory_count: 0 },
          image: null,
          variant: null,
        }))
      )
    }
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await loadDbCart(user.id)
      } else {
        setItems(getLocalCart())
      }
      setLoading(false)
    }
    init()
  }, [loadDbCart, supabase.auth])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price_at_time * i.quantity, 0)

  const ensureDbCart = useCallback(async (userId: string) => {
    const { data: existing } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle()

    if (existing) return existing.id

    const { data: newCart } = await supabase
      .from("carts")
      .insert({ user_id: userId })
      .select("id")
      .single()

    return newCart?.id
  }, [supabase])

  const addItem = useCallback(
    async ({
      product,
      image,
      variant,
      quantity = 1,
    }: {
      product: CartItemDisplay["product"]
      image: string | null
      variant?: CartItemDisplay["variant"] | null
      quantity?: number
    }) => {
      const price = getPrice(product)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const cartId = await ensureDbCart(user.id)
        if (!cartId) return

        const productId = (product as AddItemProduct).id ?? product.slug
        const { data: existing } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("cart_id", cartId)
          .eq("product_id", productId)
          .maybeSingle()

        if (existing) {
          await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + quantity })
            .eq("id", existing.id)
        } else {
          await supabase.from("cart_items").insert({
            cart_id: cartId,
            product_id: productId,
            variant_id: null,
            quantity,
            price_at_time: price,
          })
        }

        await loadDbCart(user.id)
      } else {
        setItems((prev) => {
          const idx = prev.findIndex(
            (i) =>
              i.product.slug === product.slug &&
              i.variant?.size === variant?.size &&
              i.variant?.color === variant?.color
          )
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity }
            setLocalCart(next)
            return next
          }
          const newItem: CartItemDisplay = {
            id: crypto.randomUUID(),
            cart_id: "",
            product_id: (product as AddItemProduct).id ?? product.slug,
            variant_id: null,
            quantity,
            price_at_time: price,
            product,
            image,
            variant,
          }
          const next = [...prev, newItem]
          setLocalCart(next)
          return next
        })
      }
    },
    [supabase, ensureDbCart, loadDbCart]
  )

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        if (quantity <= 0) {
          await supabase.from("cart_items").delete().eq("id", itemId)
        } else {
          await supabase.from("cart_items").update({ quantity }).eq("id", itemId)
        }
        await loadDbCart(user.id)
      } else {
        setItems((prev) => {
          const next =
            quantity <= 0
              ? prev.filter((i) => i.id !== itemId)
              : prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
          setLocalCart(next)
          return next
        })
      }
    },
    [supabase, loadDbCart]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("cart_items").delete().eq("id", itemId)
        await loadDbCart(user.id)
      } else {
        setItems((prev) => {
          const next = prev.filter((i) => i.id !== itemId)
          setLocalCart(next)
          return next
        })
      }
    },
    [supabase, loadDbCart]
  )

  const clearCart = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
      if (cart) {
        await supabase.from("cart_items").delete().eq("cart_id", cart.id)
      }
      setItems([])
    } else {
      setItems([])
      setLocalCart([])
    }
  }, [supabase])

  const mergeGuestCart = useCallback(async () => {
    const guestItems = getLocalCart()
    if (guestItems.length === 0) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const cartId = await ensureDbCart(user.id)
    if (!cartId) return

    for (const gi of guestItems) {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("product_id", gi.product_id)
        .maybeSingle()

      if (existing) {
        await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + gi.quantity })
          .eq("id", existing.id)
      } else {
        await supabase.from("cart_items").insert({
          cart_id: cartId,
          product_id: gi.product_id,
          variant_id: gi.variant_id,
          quantity: gi.quantity,
          price_at_time: gi.price_at_time,
        })
      }
    }

    sessionStorage.removeItem("guest_cart")
    await loadDbCart(user.id)
  }, [supabase, ensureDbCart, loadDbCart])

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        sessionId,
        loading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        mergeGuestCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within a CartProvider")
  return ctx
}
