'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else window.location.href = '/'
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── Hero ──────────────────────────────────── */}
      <div className="hero-grad-login relative overflow-hidden flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-10">

        {/* Ambient glows */}
        <div className="absolute top-0 left-1/2 w-96 h-96 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: '#10b981', transform: 'translate(-50%,-40%)' }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: '#6366f1', transform: 'translate(30%,30%)' }} />

        {/* Brand mark */}
        <div className="relative mb-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <span className="text-4xl">💪</span>
          </div>
          <div className="text-[11px] font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--accent)' }}>
            Your fitness journey
          </div>
          <h1 className="text-5xl font-black tracking-tight leading-none" style={{ color: 'var(--text)' }}>FitTrack</h1>
          <p className="text-sm font-medium mt-3" style={{ color: 'var(--muted)' }}>
            Train smart. Eat right. Track everything.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {['💪 PPL Workouts', '🥗 Nutrition', '📈 Progress', '⌚ Samsung Health'].map(f => (
            <span key={f} className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', boxShadow: 'var(--shadow-sm)' }}>
              {f}
            </span>
          ))}
        </div>

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <h2 className="text-xl font-black mb-5" style={{ color: 'var(--text)' }}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </h2>

            {error && (
              <div className="text-sm rounded-xl px-4 py-3 mb-4 font-medium"
                style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e' }}>
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted2)' }}>
                Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm font-medium"
              />
            </div>

            <div className="mb-6">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted2)' }}>
                Password
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 text-sm font-medium"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full text-white font-black py-4 rounded-xl text-sm tracking-[0.1em] uppercase disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <button
              type="button"
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}
              className="w-full text-sm mt-4 font-medium"
              style={{ color: 'var(--muted)' }}>
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
