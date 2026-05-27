'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/state/store'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',    abbr: 'DX', color: 'var(--dx)' },
  { href: '/diagnostico',  label: 'Diagnóstico',  abbr: 'DX', color: 'var(--dx)' },
  { href: '/marketing',    label: 'Marketing',    abbr: 'MK', color: 'var(--mk)' },
  { href: '/vendas',       label: 'Vendas',       abbr: 'VD', color: 'var(--vd)' },
  { href: '/financeiro',   label: 'Financeiro',   abbr: 'FN', color: 'var(--fn)' },
  { href: '/evolucao',     label: 'Evolução',     abbr: 'EV', color: 'var(--ev)' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const clearSession = useStore(s => s.clearSession)

  async function handleLogout() {
    const supa = createClient()
    await supa.auth.signOut()
    clearSession()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 overflow-y-auto py-5 px-3"
           style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
      {/* logo */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
             style={{ background: 'var(--accent)' }}>
          DM
        </div>
        <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>DigitalMind</span>
      </div>

      {/* nav */}
      <nav className="flex-1 space-y-0.5">
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: active ? 'var(--surface-2)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--muted)',
              }}
            >
              <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: item.color }}>
                {item.abbr}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left mt-4"
        style={{ color: 'var(--muted)' }}
      >
        <span className="text-base">↩</span>
        Sair
      </button>
    </aside>
  )
}
