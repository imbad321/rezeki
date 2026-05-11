export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass h-24 animate-shimmer" />)}
      </div>
      <div className="glass h-14 animate-shimmer" />
      <div className="glass h-96 animate-shimmer" />
    </div>
  )
}
