"use client"

import { useEffect, useState, useCallback } from "react"
import { useClient } from "@/lib/client-context"
import { BudgetTable } from "@/components/budget/BudgetTable"
import { BudgetBarChart } from "@/components/budget/BudgetBarChart"

export default function BudgetPage() {
  const { selected } = useClient()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/budget?clientId=${selected.id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected])

  useEffect(() => { load() }, [load])

  if (loading || !data) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="glass h-72 animate-shimmer" />
        <div className="glass h-56 animate-shimmer" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <BudgetTable data={data} />
      <BudgetBarChart data={data} />
    </div>
  )
}
