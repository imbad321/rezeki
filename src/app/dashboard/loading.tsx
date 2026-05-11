export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-7xl animate-pulse">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 p-5 h-72" />
        <div className="bg-white rounded-xl border border-slate-200 p-5 h-72" />
      </div>
    </div>
  )
}
