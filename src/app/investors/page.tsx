"use client"

import { useEffect, useState, useCallback } from "react"
import { useClient } from "@/lib/client-context"
import { InvestorDashboard } from "@/components/investors/InvestorDashboard"

export default function InvestorsPage() {
  const { selected } = useClient()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!selected) return
    setLoading(true)
    Promise.all([
      fetch(`/api/investors?clientId=${selected.id}`).then((r) => r.json()),
      fetch(`/api/investors?clientId=${selected.id}`).then(() =>
        fetch(`/api/cap-table?clientId=${selected.id}`).then((r) => r.json())
      ),
    ]).then(([investors, capTable]) => {
      setData({ investors, capTable, rounds: capTable.map((e: any) => e.round).filter(Boolean) })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [selected])

  useEffect(() => { load() }, [load])

  if (loading || !data) {
    return (
      <div className="space-y-6 max-w-7xl animate-pulse">
        <div className="glass h-64 animate-shimmer" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="glass h-48 animate-shimmer" />
          <div className="glass h-48 animate-shimmer" />
        </div>
      </div>
    )
  }

  const uniqueRounds = Array.from(
    new Map(data.rounds.map((r: any) => [r.id, r])).values()
  )

  return <InvestorDashboard investors={data.investors} rounds={uniqueRounds as any} capTable={data.capTable} />
}
