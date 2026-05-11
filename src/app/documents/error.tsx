"use client"

export default function DocumentsError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
      <div className="text-slate-400 text-sm mb-4">Failed to load documents.</div>
      <button
        onClick={reset}
        className="text-sm font-medium px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
