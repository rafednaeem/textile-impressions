export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
      <div className="animate-pulse lg:flex lg:gap-12">
        <div className="aspect-[3/4] w-full rounded-xl bg-muted lg:w-1/2" />
        <div className="mt-6 flex-1 space-y-4 lg:mt-0">
          <div className="h-8 w-3/4 rounded bg-muted" />
          <div className="h-6 w-1/4 rounded bg-muted" />
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="h-12 w-full rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
