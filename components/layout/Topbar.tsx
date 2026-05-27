'use client'

import { useStore } from '@/lib/state/store'

export function Topbar() {
  const companyName = useStore(s => s.formData.companyName)
  const maturity = useStore(s => s.maturityRealScore)

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
            style={{
              background: 'var(--surface)',
              borderBottom: '1px solid var(--border)',
            }}>
      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
        {companyName || 'Minha Empresa'}
      </span>

      {maturity > 0 && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 rounded-full overflow-hidden"
               style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${maturity}%`, background: 'var(--accent)' }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {maturity}%
          </span>
        </div>
      )}
    </header>
  )
}
