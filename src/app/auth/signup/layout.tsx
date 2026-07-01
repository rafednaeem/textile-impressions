import type { Metadata } from "next"
import { storeName } from "@/lib/constants"

export const metadata: Metadata = {
  title: `Create Account — ${storeName}`,
  robots: { index: false, follow: false },
}

export default function AuthSignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
