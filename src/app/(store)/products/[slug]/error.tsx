"use client"

export default function ProductError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-heading text-2xl font-bold text-brand-forest">
        Failed to load product
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong while loading this product.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-forest/90"
      >
        Try Again
      </button>
    </div>
  )
}
