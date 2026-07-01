"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { ShoppingBag, Menu, X, User, LogOut, Package, Heart, MapPin, Settings, Shield } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import CartDrawer from "./CartDrawer"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Lookbook", href: "/lookbook" },
  { label: "Colors & Paints", href: "/colors" },
  { label: "Custom Orders", href: "/custom-orders" },
  { label: "Skills Studio", href: "/skills-studio" },
  { label: "Incubator", href: "/incubator" },
  { label: "About", href: "/craft-guide" },
]

export default function Header() {
  const { itemCount } = useCart()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 140)
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const validateSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const isAdmin = user.app_metadata?.role === "admin"
      const hasRememberMe = localStorage.getItem("remember_me") === "1"
      const sessionActive = sessionStorage.getItem("ti_session_active") === "1"

      if (isAdmin) {
        if (!sessionActive) {
          await supabase.auth.signOut()
          sessionStorage.clear()
          router.push("/auth/login")
        }
      } else {
        if (!hasRememberMe && !sessionActive) {
          await supabase.auth.signOut()
          sessionStorage.clear()
          router.push("/auth/login")
        }
      }
    }
    validateSession()
  }, [supabase, router])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isHome = pathname === "/"
  const showHeader = !isHome || scrolled
  const isLoggedIn = !!user
  const isAdmin = user?.app_metadata?.role === "admin"
  const userInitial = (user?.user_metadata?.full_name || user?.email || "?")[0].toUpperCase()

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    localStorage.removeItem("remember_me")
    sessionStorage.clear()
    setUser(null)
    setUserMenuOpen(false)
    setSigningOut(false)
    router.push("/")
  }

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

          <div className="flex items-center gap-2">
            <div className="relative" ref={userMenuRef}>
              {isLoggedIn ? (
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-forest text-xs font-bold text-white transition-colors hover:bg-brand-forest/90"
                  aria-label="Account menu"
                >
                  {userInitial}
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-brand-indigo"
                  aria-label="Sign in"
                >
                  <User className="h-5 w-5" />
                </Link>
              )}

              <AnimatePresence>
                {userMenuOpen && isLoggedIn && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-white shadow-lg"
                  >
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.user_metadata?.full_name || "Account"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/account/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>
                      <Link
                        href="/account/wishlist"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Heart className="h-4 w-4" />
                        Wishlist
                      </Link>
                      <Link
                        href="/account/addresses"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <MapPin className="h-4 w-4" />
                        Addresses
                      </Link>
                      <Link
                        href="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Settings className="h-4 w-4" />
                        My Account
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-brand-indigo transition-colors hover:bg-muted"
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-border py-1">
                      <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <LogOut className="h-4 w-4" />
                        {signingOut ? "Signing out..." : "Sign Out"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-muted-foreground transition-colors hover:text-brand-indigo"
              aria-label="Open cart"
              data-testid="cart-trigger"
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
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-forest text-xs font-bold text-white">
                      {userInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || "Account"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link href="/account/orders" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-brand-indigo">
                    <Package className="h-4 w-4" /> My Orders
                  </Link>
                  <Link href="/account/wishlist" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-brand-indigo">
                    <Heart className="h-4 w-4" /> Wishlist
                  </Link>
                  <Link href="/account" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-brand-indigo">
                    <Settings className="h-4 w-4" /> My Account
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-brand-indigo transition-colors hover:bg-muted">
                      <Shield className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={async () => { await handleSignOut(); setMobileOpen(false) }}
                    disabled={signingOut}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-brand-indigo"
                  >
                    <LogOut className="h-4 w-4" /> {signingOut ? "Signing out..." : "Sign Out"}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-brand-indigo">
                    <User className="h-4 w-4" /> Sign In
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg bg-brand-forest px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-forest/90">
                    Create Account
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}

