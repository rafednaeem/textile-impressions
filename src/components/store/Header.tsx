"use client"

import Link from "next/link"
import { useState } from "react"
import { ShoppingBag, Menu, X } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion"
import { usePathname } from "next/navigation"
import CartDrawer from "./CartDrawer"

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Colors & Paints", href: "/colors" },
  { label: "Custom Orders", href: "/custom-orders" },
  { label: "Skills Studio", href: "/skills-studio" },
  { label: "Incubator", href: "/incubator" },
  { label: "About", href: "/craft-guide" },
]

export default function Header() {
  const { itemCount } = useCart()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 140)
  })

  const isHome = pathname === "/"
  const showHeader = !isHome || scrolled

  return (
    <>
      <motion.header
        initial={false}
        animate={{ opacity: showHeader ? 1 : 0, y: showHeader ? 0 : -18, pointerEvents: showHeader ? "auto" : "none" }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="fixed top-0 z-50 w-full border-b border-brand-umber/10 bg-brand-ivory/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-brand-ivory/80"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-heading text-xl font-bold tracking-tight text-brand-indigo">
            Textile Impressions
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand-indigo"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-muted-foreground transition-colors hover:text-brand-indigo"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-saffron text-[10px] font-bold text-brand-umber">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 text-muted-foreground md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-72 border-l border-border bg-background shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="font-heading text-lg font-bold text-brand-indigo">Menu</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-2 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-brand-indigo"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2" />
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-brand-indigo"
              >
                Sign In
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
