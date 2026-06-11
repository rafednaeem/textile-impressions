"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-muted p-4">
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <h1 className="mt-4 font-heading text-2xl font-bold text-brand-forest">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We encountered an unexpected error. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-forest/90"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-full border border-border px-6 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
