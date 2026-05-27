'use client'

import { useState } from 'react'
import { useStore } from '@/lib/state/store'
import { KanbanBoard } from './KanbanBoard'
import { DiagnosticoVendas } from './DiagnosticoVendas'
import { MetasComerciais } from './MetasComerciais'
import { AgenteVendas } from './AgenteVendas'
import { calcKanbanKPIs } from '@/lib/utils/vendas'

type Tab = 'crm' | 'diagnostico' | 'metas' | 'agente'

const TABS: { id: Tab; label: string }[] = [
  { id: 'crm',         label: 'CRM' },
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'metas',       label: 'Metas' },
  { id: 'agente',      label: 'Agente IA' },
]

export function VendasModule() {
  const [tab, setTab] = useState<Tab>('crm')

  const salesLeads   = useStore(s => s.salesLeads)
  const salesGoals   = useStore(s => s.salesGoals)
  const salesProfile = useStore(s => s.salesProfile)

  const kpis = calcKanbanKPIs(salesLeads)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Vendas</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {salesLeads.length} leads · {salesGoals.length} meta{salesGoals.length !== 1 ? 's' : ''}
            {salesProfile ? ' · Diagnóstico concluído' : ''}
          </p>
        </div>

        {/* Alert badge */}
        {kpis.leadsAlerts > 0 && (
          <span className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444' }}>
            ⚠ {kpis.leadsAlerts} lead{kpis.leadsAlerts > 1 ? 's' : ''} atrasado{kpis.leadsAlerts > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium transition-colors relative"
            style={{
              color: tab === t.id ? 'var(--text)' : 'var(--muted)',
              borderBottom: tab === t.id ? '2px solid var(--vd)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
            {/* Badge for diagnostico */}
            {t.id === 'diagnostico' && !salesProfile && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                    style={{ background: 'var(--vd)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'crm' && <KanbanBoard leads={salesLeads} />}
      {tab === 'diagnostico' && <DiagnosticoVendas />}
      {tab === 'metas' && <MetasComerciais />}
      {tab === 'agente' && <AgenteVendas />}
    </div>
  )
}
