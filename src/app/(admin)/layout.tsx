"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, ShoppingBag, Package, Users, Boxes, Tag, Settings, LogOut, Menu, X, ChevronDown, Camera, Images, Palette, ClipboardList, Handshake, GraduationCap,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/discounts", label: "Discount Codes", icon: Tag },
  { href: "/admin/skills-studio", label: "Skills Studio", icon: GraduationCap },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/artisans", label: "Artisans", icon: Palette },
  { href: "/admin/ugc-photos", label: "UGC Photos", icon: Images },
  { href: "/admin/collections", label: "Collections", icon: Camera },
  { href: "/admin/custom-orders", label: "Custom Orders", icon: ClipboardList },
  { href: "/admin/incubator-enquiries", label: "Incubator Enquiries", icon: Handshake },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (data) setProfile(data)
    }
    fetch()
  }, [supabase])

  const logout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("remember_me")
    sessionStorage.clear()
    router.push("/auth/login")
  }

  return (
    <div className="flex min-h-screen bg-muted/30 font-[family:var(--font-inter)]">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-forest text-sm font-bold text-white">
            TI
          </div>
          <span className="font-heading text-lg font-bold text-brand-forest">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-forest text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="relative border-t border-border p-4">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-terracotta text-xs font-bold text-white">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 truncate text-left">
              <p className="text-sm font-medium truncate">{profile?.full_name || "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email || ""}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {userMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 rounded-lg border border-border bg-card p-1 shadow-lg">
              <Link href="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                <Settings className="h-4 w-4" /> View Store
              </Link>
              <button onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">View Store</Link>
          <div className="hidden items-center gap-3 lg:flex">
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.full_name || "Admin"}</p>
              <p className="text-xs text-muted-foreground">{profile?.email || ""}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-terracotta text-xs font-bold text-white">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-card lg:hidden">
        {navItems.slice(0, 5).map((item) => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium ${
                isActive ? "text-brand-forest" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-64 flex-col bg-card">
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <span className="font-heading text-lg font-bold text-brand-forest">Admin</span>
              <button onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {navItems.map((item) => {
                const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-forest text-white"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-border p-4">
              <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
