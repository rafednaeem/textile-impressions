import type { Metadata } from "next"
import { storeName } from "@/lib/constants"

export const metadata: Metadata = {
  title: `Admin — ${storeName}`,
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
