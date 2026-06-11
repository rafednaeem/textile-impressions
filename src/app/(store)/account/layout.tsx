"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Package, Heart, MapPin, LogOut } from "lucide-react"
import AuthGuard from "@/components/shared/AuthGuard"

const navItems = [
  { label: "Overview", href: "/account", icon: User },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-bold text-brand-forest">My Account</h1>
        <div className="mt-6 lg:flex lg:gap-10">
          <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border pb-2 lg:mb-0 lg:w-48 lg:flex-col lg:border-b-0 lg:pb-0">
            {navItems.map((item) => {
              const isActive =
                item.href === "/account"
                  ? pathname === "/account"
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </AuthGuard>
  )
}
