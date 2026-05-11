"use client"

import { useEffect, useState, useCallback } from "react"
import { useClient } from "@/lib/client-context"
import { useSession } from "next-auth/react"
import { InvestorCard } from "@/components/investors/InvestorCard"
import { RoundTimeline } from "@/components/investors/RoundTimeline"
import { CapTable } from "@/components/investors/CapTable"
import { INVESTOR_TYPE_LABELS, ROUND_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Plus, X, Users } from "lucide-react"
import type { Investor, FundingRound, CapTableEntry } from "@/schemas/investor"

const INVESTOR_TYPES = Object.keys(INVESTOR_TYPE_LABELS) as (keyof typeof INVESTOR_TYPE_LABELS)[]
const ROUND_TYPES    = Object.keys(ROUND_LABELS)         as (keyof typeof ROUND_LABELS)[]

const TYPE_COLORS: Record<string, string> = {
  LEAD_VC: "#6366f1", VC: "#22d3ee", ANGEL: "#f59e0b", STRATEGIC: "#22d3a5",
}

// ── Add Investor Modal ────────────────────────────────────────────────────────

function AddInvestorModal({
  open, clientId, onClose, onSaved,
}: { open: boolean; clientId?: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName]         = useState("")
  const [firm, setFirm]         = useState("")
  const [type, setType]         = useState("VC")
  const [email, setEmail]       = useState("")
  const [leadRound, setLR]      = useState("")
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState("")

  useEffect(() => {
    if (open) { setName(""); setFirm(""); setType("VC"); setEmail(""); setLR(""); setError("") }
  }, [open])

  if (!open) return null

  async function handleSave() {
    if (!name.trim()) { setError("Name is required"); return }
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/investors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, name, firm, type, email, leadRound: leadRound || null }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return }
      onSaved(); onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="glass-solid rounded-2xl p-6 shadow-2xl border border-[var(--border-strong)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white">Add Investor</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Chen" autoFocus
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[var(--primary)] transition-colors" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Firm</label>
              <input value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="e.g. Sequoia Capital"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[var(--primary)] transition-colors" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Investor Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {INVESTOR_TYPES.map((t) => (
                  <button key={t} onClick={() => setType(t)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                      type === t
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 text-white"
                        : "border-[var(--border)] text-slate-400 hover:text-white hover:border-white/20"
                    )}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TYPE_COLORS[t] ?? "#64748b" }} />
                    {INVESTOR_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="investor@vc.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[var(--primary)] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Lead Round</label>
                <select value={leadRound} onChange={(e) => setLR(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0d1117] border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-colors">
                  <option value="">None</option>
                  {ROUND_TYPES.map((r) => <option key={r} value={r}>{ROUND_LABELS[r]}</option>)}
                </select>
              </div>
            </div>

            {error && <p className="text-xs text-[var(--negative)]">{error}</p>}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={!name.trim() || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-40 transition-all">
              {saving ? "Saving…" : "Add Investor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Add Round Modal ───────────────────────────────────────────────────────────

function AddRoundModal({
  open, clientId, onClose, onSaved,
}: { open: boolean; clientId?: string; onClose: () => void; onSaved: () => void }) {
  const now = new Date()
  const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

  const [roundType, setRoundType]   = useState("SEED")
  const [closedAt, setClosedAt]     = useState(defaultDate)
  const [raised, setRaised]         = useState("")
  const [preMoney, setPreMoney]     = useState("")
  const [postMoney, setPostMoney]   = useState("")
  const [leadInv, setLeadInv]       = useState("")
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState("")

  useEffect(() => {
    if (open) {
      setRoundType("SEED"); setClosedAt(defaultDate); setRaised(""); setPreMoney("")
      setPostMoney(""); setLeadInv(""); setError("")
    }
  }, [open])

  if (!open) return null

  async function handleSave() {
    if (!raised) { setError("Amount raised is required"); return }
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/investors/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId, roundType, closedAt,
          amountRaised: parseFloat(raised) || 0,
          preMoneyVal:  parseFloat(preMoney) || 0,
          postMoneyVal: parseFloat(postMoney) || 0,
          leadInvestor: leadInv || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return }
      onSaved(); onClose()
    } finally { setSaving(false) }
  }

  function Field({ label, value, onChange, prefix, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; prefix?: string; placeholder?: string
  }) {
    return (
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">{label}</label>
        <div className="relative">
          {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{prefix}</span>}
          <input type="number" min="0" step="any" value={value} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? "0"}
            className={cn(
              "w-full py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-colors tabular",
              prefix ? "pl-7 pr-3" : "px-3"
            )} />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="glass-solid rounded-2xl p-6 shadow-2xl border border-[var(--border-strong)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white">Add Funding Round</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Round Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {ROUND_TYPES.map((r) => (
                  <button key={r} onClick={() => setRoundType(r)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-semibold transition-all border",
                      roundType === r
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 text-white"
                        : "border-[var(--border)] text-slate-400 hover:text-white hover:border-white/20"
                    )}>
                    {ROUND_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Close Date *</label>
              <input type="date" value={closedAt} onChange={(e) => setClosedAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-colors" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Raised *"    value={raised}   onChange={setRaised}   prefix="$" />
              <Field label="Pre-Money"   value={preMoney} onChange={setPreMoney} prefix="$" />
              <Field label="Post-Money"  value={postMoney} onChange={setPostMoney} prefix="$" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Lead Investor</label>
              <input value={leadInv} onChange={(e) => setLeadInv(e.target.value)} placeholder="e.g. Sequoia Capital"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[var(--primary)] transition-colors" />
            </div>

            {error && <p className="text-xs text-[var(--negative)]">{error}</p>}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={!raised || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-40 transition-all">
              {saving ? "Saving…" : "Add Round"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InvestorsPage() {
  const { selected, isLoading: clientLoading } = useClient()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const [investors, setInvestors]   = useState<Investor[]>([])
  const [rounds, setRounds]         = useState<FundingRound[]>([])
  const [capTable, setCapTable]     = useState<CapTableEntry[]>([])
  const [loading, setLoading]       = useState(false)
  const [addInvOpen, setAddInvOpen] = useState(false)
  const [addRndOpen, setAddRndOpen] = useState(false)

  const load = useCallback(() => {
    if (!selected) return
    setLoading(true)
    Promise.all([
      fetch(`/api/investors?clientId=${selected.id}`).then((r) => r.json()),
      fetch(`/api/investors/rounds?clientId=${selected.id}`).then((r) => r.json()),
      fetch(`/api/cap-table?clientId=${selected.id}`).then((r) => r.json()),
    ]).then(([inv, rds, ct]) => {
      setInvestors(Array.isArray(inv) ? inv : [])
      setRounds(Array.isArray(rds) ? rds : [])
      setCapTable(Array.isArray(ct) ? ct : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [selected])

  useEffect(() => {
    if (!selected) { setInvestors([]); setRounds([]); setCapTable([]); return }
    load()
  }, [selected, load])

  if (clientLoading || (selected && loading)) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="glass h-16 animate-shimmer" />
        <div className="glass h-64 animate-shimmer" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="glass h-48 animate-shimmer" />
          <div className="glass h-48 animate-shimmer" />
        </div>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="text-slate-500 font-medium mb-1">No portfolio company selected</div>
          <div className="text-slate-600 text-sm">Add a client from the Clients page to get started</div>
        </div>
      </div>
    )
  }

  const isEmpty = investors.length === 0 && rounds.length === 0

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Investors</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {investors.length} investor{investors.length !== 1 ? "s" : ""} · {rounds.length} funding round{rounds.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddRndOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm font-semibold hover:bg-white/10 transition-all"
            >
              <Plus size={15} />
              Add Round
            </button>
            <button
              onClick={() => setAddInvOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus size={15} />
              Add Investor
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div className="glass flex flex-col items-center justify-center py-24 gap-5 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center animate-float">
            <Users size={28} className="text-slate-600" />
          </div>
          <div className="text-center">
            <div className="text-white font-semibold text-base mb-1.5">No investor data yet</div>
            <div className="text-slate-500 text-sm max-w-xs">
              Add investors and funding rounds to build the cap table and track your raise history.
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAddRndOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm font-semibold hover:bg-white/10 transition-all"
              >
                <Plus size={15} /> Add Round
              </button>
              <button
                onClick={() => setAddInvOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus size={15} /> Add Investor
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Cap table (only when it has entries) */}
          {capTable.length > 0 && <CapTable entries={capTable} />}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Funding rounds */}
            {rounds.length > 0 && (
              <div className="glass p-5 animate-slide-up delay-50">
                <RoundTimeline rounds={rounds} />
              </div>
            )}

            {/* Investor grid */}
            {investors.length > 0 && (
              <div className="glass p-5 animate-slide-up delay-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-white">Investors</div>
                  <span className="text-[10px] text-slate-600 font-medium">{investors.length} total</span>
                </div>
                <div className="space-y-3">
                  {investors.map((inv) => (
                    <InvestorCard key={inv.id} investor={inv} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <AddInvestorModal
        open={addInvOpen}
        clientId={selected.id}
        onClose={() => setAddInvOpen(false)}
        onSaved={load}
      />
      <AddRoundModal
        open={addRndOpen}
        clientId={selected.id}
        onClose={() => setAddRndOpen(false)}
        onSaved={load}
      />
    </div>
  )
}
