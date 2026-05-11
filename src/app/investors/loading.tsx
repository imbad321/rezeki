export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass h-36 animate-shimmer" />)}
      </div>
    </div>
  )
}
