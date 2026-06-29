"use client"

import { X, Minus, Plus, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/hooks/useCart"

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, subtotal, itemCount, updateQuantity, removeItem } = useCart()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            data-testid="cart-drawer"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <h2 className="font-heading text-lg font-bold">
                Cart ({itemCount})
              </h2>
              <button onClick={onClose} aria-label="Close cart">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
                <div className="rounded-full bg-muted p-4">
                  <svg
                    className="h-8 w-8 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">Your cart is empty</p>
                <Link
                  href="/shop"
                  onClick={onClose}
                  className="rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-forest/90"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li key={item.id} className="flex gap-3">
                        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : null}
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <Link
                              href={`/products/${item.product.slug}`}
                              onClick={onClose}
                              className="text-sm font-medium hover:underline"
                            >
                              {item.product.name}
                            </Link>
                            {item.variant && (
                              <p className="text-xs text-muted-foreground">
                                {[item.variant.size, item.variant.color]
                                  .filter(Boolean)
                                  .join(" / ")}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                Rs. {item.price_at_time.toLocaleString()}
                              </span>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-muted-foreground transition-colors hover:text-destructive"
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-border px-4 py-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      Rs. {subtotal.toLocaleString()}
                    </span>
                  </div>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Shipping calculated at checkout
                  </p>
                  <Link
                    href="/checkout"
                    onClick={onClose}
                    className="flex w-full items-center justify-center rounded-full bg-brand-forest px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-forest/90"
                  >
                    Proceed to Checkout
                  </Link>
                  <button
                    onClick={onClose}
                    className="mt-2 w-full text-center text-sm text-muted-foreground underline underline-offset-2"
                  >
                    Continue Shopping
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
