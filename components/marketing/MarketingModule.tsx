'use client'

import { useState } from 'react'
import { useStore } from '@/lib/state/store'
import { CalendarioConteudo } from './CalendarioConteudo'
import { AgenteMkt } from './AgenteMkt'
import { MetasMkt } from './MetasMkt'
import { RelatorioMkt } from './RelatorioMkt'
import { calcCalStats, currentMonthKey, calcGoalProgress } from '@/lib/utils/marketing'

type Tab = 'calendario' | 'agente' | 'metas' | 'relatorio'

const TABS: { id: Tab; label: string }[] = [
  { id: 'calendario', label: 'Calendário' },
  { id: 'agente',     label: 'Agente IA'  },
  { id: 'metas',      label: 'Metas'      },
  { id: 'relatorio',  label: 'Relatório'  },
]

export function MarketingModule() {
  const [tab, setTab] = useState<Tab>('calendario')

  const contentCalendar = useStore(s => s.contentCalendar)
  const mktGoals        = useStore(s => s.mktGoals)

  const monthKey = currentMonthKey()
  const stats    = calcCalStats(contentCalendar, monthKey)
  const goalProg = calcGoalProgress(contentCalendar, mktGoals)

  const monthGoalTarget = goalProg.monthTarget
  const monthGoalPct    = monthGoalTarget > 0
    ? Math.min(100, (goalProg.monthPublished / monthGoalTarget) * 100)
    : null

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Marketing</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {stats.total} conteúdo{stats.total !== 1 ? 's' : ''} este mês
            {stats.publicado > 0 && ` · ${stats.publicado} publicado${stats.publicado !== 1 ? 's' : ''}`}
            {monthGoalPct !== null && ` · ${monthGoalPct.toFixed(0)}% da meta`}
          </p>
        </div>

        {/* Mini progress vs monthly goal */}
        {monthGoalTarget > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, monthGoalPct ?? 0)}%`,
                  background: (monthGoalPct ?? 0) >= 100 ? '#10b981' : 'var(--mk)',
                }}
              />
            </div>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {goalProg.monthPublished}/{monthGoalTarget} este mês
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: tab === t.id ? 'var(--text)' : 'var(--muted)',
              borderBottom: tab === t.id ? '2px solid var(--mk)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'calendario' && <CalendarioConteudo />}
      {tab === 'agente'     && <AgenteMkt />}
      {tab === 'metas'      && <MetasMkt />}
      {tab === 'relatorio'  && <RelatorioMkt />}
    </div>
  )
}
