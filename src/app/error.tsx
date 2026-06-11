"use client"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <span className="font-heading text-6xl font-bold text-brand-terracotta/20">Oops!</span>
      <h1 className="mt-4 font-heading text-3xl font-bold text-brand-forest">Something went wrong</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center rounded-full bg-brand-forest px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-forest/90"
      >
        Try Again
      </button>
    </div>
  )
}
