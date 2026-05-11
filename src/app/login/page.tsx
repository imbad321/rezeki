"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Landmark, Eye, EyeOff, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError("Invalid email or password.")
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4 bg-grid">
      <div className="w-full max-w-sm animate-scale-in">

        {/* Brand */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center glow-green">
            <Landmark size={20} className="text-white" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white tracking-tight">Rezeki Holdings Group</div>
            <div className="text-sm text-slate-500 mt-1">Portfolio Finance Platform</div>
          </div>
        </div>

        {/* Form */}
        <div className="glass-solid rounded-2xl p-6 border border-[var(--border-strong)]">
          <div className="text-base font-semibold text-white mb-5">Sign in</div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rezeki.com"
                autoComplete="email"
                autoFocus
                required
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-[var(--negative)] bg-[var(--negative-dim)] px-3 py-2.5 rounded-xl">
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all mt-2"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Default credentials hint */}
        <div className="mt-4 glass rounded-xl p-3 text-center">
          <p className="text-[11px] text-slate-500">
            Default admin: <span className="text-slate-300 font-mono">admin@rezeki.com</span>{" "}
            / <span className="text-slate-300 font-mono">admin</span>
          </p>
        </div>
      </div>
    </div>
  )
}
