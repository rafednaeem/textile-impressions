import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <span className="font-heading text-8xl font-bold text-brand-terracotta/20">404</span>
      <h1 className="mt-4 font-heading text-3xl font-bold text-brand-forest">Page Not Found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/shop"
        className="mt-8 inline-flex items-center rounded-full bg-brand-forest px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-forest/90"
      >
        Browse Collections
      </Link>
    </div>
  )
}
