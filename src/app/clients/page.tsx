"use client"

import { useState, useEffect, useCallback } from "react"
import { useClient } from "@/lib/client-context"
import { CLIENT_PRESET_COLORS, CLIENT_STAGES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Plus, Pencil, Trash2, Building2, X } from "lucide-react"

interface ClientFull {
  id: string
  name: string
  industry: string | null
  stage: string | null
  color: string
  _count?: { transactions: number }
}

interface FormState {
  name: string
  industry: string
  stage: string
  color: string
}

const EMPTY_FORM: FormState = { name: "", industry: "", stage: "Seed", color: "#10b981" }

function Badge({ color, name }: { color: string; name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
  return (
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold text-white shrink-0"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 8px 24px ${color}44` }}
    >
      {initials}
    </div>
  )
}

function ClientCard({
  client,
  onEdit,
  onDelete,
}: {
  client: ClientFull
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="glass p-5 flex flex-col gap-4 animate-slide-up interactive group">
      <div className="flex items-start justify-between gap-2">
        <Badge color={client.color} name={client.name} />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-y-1 group-hover:translate-y-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-200 transition-colors"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-[var(--negative-dim)] text-slate-500 hover:text-[var(--negative)] transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1">
        <div className="text-base font-semibold text-white mb-2 leading-tight">{client.name}</div>
        <div className="flex items-center gap-2 flex-wrap">
          {client.stage && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: `${client.color}20`,
                color: client.color,
                border: `1px solid ${client.color}40`,
              }}
            >
              {client.stage}
            </span>
          )}
          {client.industry && (
            <span className="text-[10px] text-slate-500">{client.industry}</span>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--border)] text-[11px] text-slate-600">
        {client._count?.transactions ?? 0} transactions
      </div>
    </div>
  )
}

function Modal({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean
  editing: ClientFull | null
  onClose: () => void
  onSave: (form: FormState, id?: string) => Promise<void>
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? { name: editing.name, industry: editing.industry ?? "", stage: editing.stage ?? "Seed", color: editing.color }
          : EMPTY_FORM
      )
      setError("")
    }
  }, [open, editing])

  if (!open) return null

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required"); return }
    setSaving(true)
    try {
      await onSave(form, editing?.id)
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div
        className="relative w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass-solid rounded-2xl p-6 shadow-2xl border border-[var(--border-strong)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white">
              {editing ? "Edit Client" : "Add New Client"}
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Company Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Nexus AI"
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                  Industry
                </label>
                <input
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                  placeholder="e.g. SaaS"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                  Stage
                </label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0d1117] border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                >
                  {CLIENT_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Brand Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {CLIENT_PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={cn(
                      "w-7 h-7 rounded-lg transition-all duration-150 shrink-0",
                      form.color === c
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#111827] scale-110"
                        : "opacity-60 hover:opacity-100 hover:scale-105"
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-[var(--negative)]">{error}</p>}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Client"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientFull[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ClientFull | null>(null)
  const { setSelected } = useClient()

  const load = useCallback(() => {
    setLoading(true)
    fetch("/api/clients?counts=1")
      .then((r) => r.json())
      .then((data: ClientFull[]) => { setClients(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(form: FormState, id?: string) {
    const res = await fetch(id ? `/api/clients/${id}` : "/api/clients", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) throw new Error("Failed")
    const saved = await res.json()
    if (!id) setSelected(saved)
    setModalOpen(false)
    setEditing(null)
    load()
  }

  async function handleDelete(client: ClientFull) {
    if (!confirm(`Delete "${client.name}" and all their data? This cannot be undone.`)) return
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" })
    load()
  }

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(c: ClientFull) { setEditing(c); setModalOpen(true) }

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="animate-slide-up">
          <h1 className="text-xl font-bold text-white tracking-tight">Portfolio Clients</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your portfolio companies and their data</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity animate-slide-up"
        >
          <Plus size={15} />
          Add Client
        </button>
      </div>

      {/* Stats bar */}
      {!loading && clients.length > 0 && (
        <div className="glass p-4 flex items-center gap-6 animate-slide-up delay-50">
          <div className="text-center">
            <div className="text-xl font-bold text-white tabular">{clients.length}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Companies</div>
          </div>
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="text-center">
            <div className="text-xl font-bold text-white tabular">
              {clients.reduce((s, c) => s + (c._count?.transactions ?? 0), 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Transactions</div>
          </div>
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="flex items-center gap-2">
            {clients.map((c) => (
              <div
                key={c.id}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: c.color }}
                title={c.name}
              >
                {c.name[0]}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass h-48 animate-shimmer" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center py-24 gap-5 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center animate-float">
            <Building2 size={28} className="text-slate-600" />
          </div>
          <div className="text-center">
            <div className="text-white font-semibold text-base mb-1.5">No portfolio companies yet</div>
            <div className="text-slate-500 text-sm max-w-xs">
              Add your first client to start tracking finances, importing statements, and managing investors.
            </div>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            Add Your First Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c, i) => (
            <div key={c.id} style={{ animationDelay: `${i * 60}ms` }}>
              <ClientCard
                client={c}
                onEdit={() => openEdit(c)}
                onDelete={() => handleDelete(c)}
              />
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        editing={editing}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
      />
    </div>
  )
}
