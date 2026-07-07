import type { Metadata } from "next"
import { storeName } from "@/lib/constants"

export const metadata: Metadata = {
  title: `My Account — ${storeName}`,
  robots: { index: false, follow: false },
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
      {children}
    </div>
  )
}
