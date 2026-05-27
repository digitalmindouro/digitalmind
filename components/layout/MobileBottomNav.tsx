'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/dashboard',   label: 'Home',       abbr: '⌂',  color: 'var(--dx)' },
  { href: '/marketing',   label: 'Marketing',  abbr: 'MK', color: 'var(--mk)' },
  { href: '/vendas',      label: 'Vendas',     abbr: 'VD', color: 'var(--vd)' },
  { href: '/financeiro',  label: 'Financeiro', abbr: 'FN', color: 'var(--fn)' },
  { href: '/evolucao',    label: 'Evolução',   abbr: 'EV', color: 'var(--ev)' },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center"
         style={{
           background: 'var(--surface)',
           borderTop: '1px solid var(--border)',
           paddingBottom: 'env(safe-area-inset-bottom)',
         }}>
      {TABS.map(tab => {
        const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-center transition-colors"
            style={{ color: active ? tab.color : 'var(--muted)' }}
          >
            <span className="text-base font-semibold leading-none">{tab.abbr}</span>
            <span className="text-[10px]">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
