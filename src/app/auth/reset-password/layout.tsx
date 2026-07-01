import type { Metadata } from "next"
import { storeName } from "@/lib/constants"

export const metadata: Metadata = {
  title: `Reset Password — ${storeName}`,
  robots: { index: false, follow: false },
}

export default function AuthResetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
