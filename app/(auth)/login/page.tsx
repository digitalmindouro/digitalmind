'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supa = createClient()
    const { error: err } = await supa.auth.signInWithPassword({ email, password })

    if (err) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
               style={{ background: 'var(--accent)' }}>
            DM
          </div>
          <span className="text-xl font-semibold" style={{ color: 'var(--text)' }}>DigitalMind</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Entre na sua conta</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {error && (
          <p className="text-sm text-red-400 rounded-lg px-3 py-2"
             style={{ background: 'rgba(239,68,68,0.1)' }}>
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-sm mt-4" style={{ color: 'var(--muted)' }}>
        Não tem conta?{' '}
        <Link href="/signup" className="font-medium" style={{ color: 'var(--accent)' }}>
          Criar agora
        </Link>
      </p>
    </div>
  )
}
