import type { Metadata } from "next"
import { storeName } from "@/lib/constants"

export const metadata: Metadata = {
  title: `Checkout — ${storeName}`,
  robots: { index: false, follow: false },
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
