import type { Metadata } from "next"
import { storeName } from "@/lib/constants"

export const metadata: Metadata = {
  title: `Workshop Registration Lookup — ${storeName}`,
  description: "Look up your workshop registration status at Textile Impressions.",
  robots: { index: false, follow: true },
}

export default function WorkshopLookupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
