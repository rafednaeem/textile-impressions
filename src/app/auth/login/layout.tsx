import type { Metadata } from "next"
import { storeName } from "@/lib/constants"

export const metadata: Metadata = {
  title: `Sign In — ${storeName}`,
  robots: { index: false, follow: false },
}

export default function AuthLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
