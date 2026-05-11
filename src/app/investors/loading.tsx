export default function InvestorsLoading() {
  return (
    <div className="space-y-8 max-w-7xl animate-pulse">
      <div>
        <div className="h-5 w-20 bg-slate-200 rounded mb-3" />
        <div className="bg-white rounded-xl border border-slate-200 h-64" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 h-80" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-24" />
          ))}
        </div>
      </div>
    </div>
  )
}
