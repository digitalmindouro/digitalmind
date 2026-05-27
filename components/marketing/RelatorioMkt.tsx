'use client'

import { useState } from 'react'
import { useStore } from '@/lib/state/store'
import { calcCalStats, FORMAT_CONFIG, MONTHS_PT, currentMonthKey } from '@/lib/utils/marketing'
import type { ContentCalendar } from '@/types/app'

// Mini horizontal bar
function BarRow({ label, value, total, color, abbr }: { label: string; value: number; total: number; color: string; abbr?: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-24 truncate text-right shrink-0" style={{ color: 'var(--muted)' }}>
        {abbr ?? label}
      </span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 999 }} />
      </div>
      <span className="w-8 text-right font-medium tabular-nums" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  )
}

// Count events by month for a ContentCalendar
function monthlyCount(cal: ContentCalendar, months = 4): { label: string; publicado: number; agendado: number }[] {
  const now = new Date()
  const result = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const evs = Object.entries(cal)
      .filter(([k]) => k.startsWith(key))
      .flatMap(([, evs]) => evs)
    result.push({
      label:     MONTHS_PT[d.getMonth()],
      publicado: evs.filter(e => e.status === 'publicado').length,
      agendado:  evs.filter(e => e.status === 'agendado').length,
    })
  }
  return result
}

export function RelatorioMkt() {
  const contentCalendar = useStore(s => s.contentCalendar)

  const [period, setPeriod] = useState<'mes' | 'total'>('mes')
  const monthKey = period === 'mes' ? currentMonthKey() : undefined
  const stats    = calcCalStats(contentCalendar, monthKey)
  const monthly  = monthlyCount(contentCalendar, 4)

  const maxMonth = Math.max(...monthly.map(m => m.publicado + m.agendado), 1)

  const publishRate = stats.total > 0 ? (stats.publicado / stats.total) * 100 : 0

  return (
    <div className="max-w-2xl space-y-5">
      {/* Period toggle */}
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Relatório de conteúdo</h3>
        <div className="flex rounded-lg overflow-hidden ml-auto" style={{ border: '1px solid var(--border)' }}>
          {(['mes', 'total'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 text-xs font-medium"
              style={{
                background: period === p ? 'var(--mk)' : 'var(--surface-2)',
                color: period === p ? '#fff' : 'var(--muted)',
              }}
            >
              {p === 'mes' ? 'Este mês' : 'Total'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total de conteúdos', value: stats.total,                    color: 'var(--text)' },
          { label: 'Publicados',         value: stats.publicado,                color: '#10b981'     },
          { label: 'Agendados',          value: stats.agendado,                 color: '#f59e0b'     },
          { label: 'Taxa de publicação', value: `${publishRate.toFixed(0)}%`,   color: 'var(--mk)'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3"
               style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {stats.total === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ border: '1px dashed var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Nenhum conteúdo {period === 'mes' ? 'neste mês' : 'registrado'} ainda.
          </p>
        </div>
      ) : (
        <>
          {/* By format */}
          <div className="rounded-xl p-4 space-y-3"
               style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Por formato</p>
            {Object.entries(FORMAT_CONFIG).map(([fmt, conf]) => (
              <BarRow
                key={fmt}
                label={conf.label}
                value={stats.byFormat[fmt] ?? 0}
                total={stats.total}
                color={conf.color}
              />
            ))}
          </div>

          {/* By platform */}
          {Object.keys(stats.byPlatform).length > 0 && (
            <div className="rounded-xl p-4 space-y-3"
                 style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Por plataforma</p>
              {Object.entries(stats.byPlatform)
                .sort((a, b) => b[1] - a[1])
                .map(([plat, count]) => (
                  <BarRow
                    key={plat}
                    label={plat}
                    abbr={plat.charAt(0).toUpperCase() + plat.slice(0, 3)}
                    value={count}
                    total={stats.total}
                    color="var(--mk)"
                  />
                ))}
            </div>
          )}

          {/* Monthly trend mini bar chart */}
          <div className="rounded-xl p-4 space-y-3"
               style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Tendência mensal</p>
            <div className="flex items-end gap-2 h-20">
              {monthly.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end gap-px" style={{ height: 56 }}>
                    <div
                      className="w-full rounded-sm"
                      style={{
                        height: `${(m.agendado / maxMonth) * 100}%`,
                        background: 'var(--border)',
                        minHeight: m.agendado > 0 ? 2 : 0,
                      }}
                    />
                    <div
                      className="w-full rounded-sm"
                      style={{
                        height: `${(m.publicado / maxMonth) * 100}%`,
                        background: '#10b981',
                        minHeight: m.publicado > 0 ? 2 : 0,
                      }}
                    />
                  </div>
                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{m.label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#10b981', display: 'inline-block' }} />
                <span style={{ color: 'var(--muted)' }}>Publicado</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--border)', display: 'inline-block' }} />
                <span style={{ color: 'var(--muted)' }}>Agendado</span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
