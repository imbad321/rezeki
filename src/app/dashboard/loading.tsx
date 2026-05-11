export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass p-5 space-y-3">
            <div className="h-2.5 w-20 rounded bg-white/5 animate-shimmer" />
            <div className="h-7 w-28 rounded bg-white/5 animate-shimmer" />
            <div className="h-2 w-16 rounded bg-white/5 animate-shimmer" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass h-72 animate-shimmer" />
        <div className="glass h-72 animate-shimmer" />
      </div>
    </div>
  )
}
