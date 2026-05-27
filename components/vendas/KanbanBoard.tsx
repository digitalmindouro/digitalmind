'use client'

import { useState } from 'react'
import { fmtBRL } from '@/lib/utils/formatters'
import {
  STAGE_CONFIG, STAGES,
  calcKanbanKPIs, daysNoContact, contactColor, parseLeadValue,
  type Stage,
} from '@/lib/utils/vendas'
import { LeadModal } from './LeadModal'
import type { CrmLead } from '@/types/app'

interface Props { leads: CrmLead[] }

export function KanbanBoard({ leads }: Props) {
  const [modalLead, setModalLead]       = useState<CrmLead | null | undefined>(undefined) // undefined = closed
  const [modalStage, setModalStage]     = useState<Stage>('novo')

  const kpis = calcKanbanKPIs(leads)

  function openNew(stage: Stage) {
    setModalStage(stage)
    setModalLead(null)
  }
  function openLead(lead: CrmLead) {
    setModalLead(lead)
  }
  function closeModal() {
    setModalLead(undefined)
  }

  return (
    <div className="space-y-4">
      {/* KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiChip label="Total de leads"    value={String(kpis.total)} />
        <KpiChip
          label="Funil (valor)"
          value={kpis.pipelineValue > 0 ? fmtBRL(kpis.pipelineValue) : '—'}
        />
        <KpiChip
          label="Fechados"
          value={String(kpis.fechadoCount)}
          color="#10b981"
        />
        <KpiChip
          label="Conversão"
          value={kpis.conversionRate > 0 ? `${kpis.conversionRate.toFixed(0)}%` : '—'}
          color={kpis.conversionRate >= 30 ? '#10b981' : '#f59e0b'}
        />
      </div>

      {kpis.leadsAlerts > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
             style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.2)' }}>
          ⚠ {kpis.leadsAlerts} lead{kpis.leadsAlerts > 1 ? 's' : ''} há mais de 7 dias sem contato
        </div>
      )}

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
        {STAGES.map(stage => {
          const conf        = STAGE_CONFIG[stage]
          const stageLeads  = leads.filter(l => l.stage === stage)
          const stageValue  = stageLeads.reduce((s, l) => s + parseLeadValue(l.value), 0)

          return (
            <div
              key={stage}
              className="shrink-0 flex flex-col gap-2 rounded-xl p-3"
              style={{
                width: 220,
                scrollSnapAlign: 'start',
                background: 'var(--surface)',
                border: `1px solid var(--border)`,
                minHeight: 300,
              }}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: conf.color }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                    {conf.label}
                  </span>
                </div>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: conf.bg, color: conf.color }}>
                  {stageLeads.length}
                </span>
              </div>

              {stageValue > 0 && (
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
                  {fmtBRL(stageValue)}
                </p>
              )}

              {/* Cards */}
              {stageLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} onClick={() => openLead(lead)} />
              ))}

              {/* Add button */}
              <button
                onClick={() => openNew(stage)}
                className="w-full mt-auto py-2 rounded-lg text-xs transition-colors"
                style={{ color: 'var(--muted)', border: '1px dashed var(--border)' }}
              >
                + Novo lead
              </button>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modalLead !== undefined && (
        <LeadModal
          lead={modalLead}
          initialStage={modalStage}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

// ─── LeadCard ─────────────────────────────────────────────────────────────────

function LeadCard({ lead, onClick }: { lead: CrmLead; onClick: () => void }) {
  const days   = daysNoContact(lead)
  const dColor = contactColor(days)

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg p-3 space-y-2 transition-colors"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      {/* Name */}
      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
        {lead.name}
      </p>

      {/* Product + value */}
      {(lead.product || lead.value) && (
        <div className="flex items-center justify-between gap-2">
          {lead.product && (
            <p className="text-xs truncate flex-1" style={{ color: 'var(--muted)' }}>{lead.product}</p>
          )}
          {lead.value && (
            <p className="text-xs font-semibold shrink-0" style={{ color: 'var(--text)' }}>{lead.value}</p>
          )}
        </div>
      )}

      {/* Days no contact */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: dColor }}>
          {days === 999 ? 'Sem contato' : days === 0 ? 'Contato hoje' : `${days}d sem contato`}
        </span>
        {lead.nextStep && (
          <span className="text-xs truncate max-w-[90px] text-right" style={{ color: 'var(--muted)' }}>
            {lead.nextStep}
          </span>
        )}
      </div>
    </button>
  )
}

// ─── KPI chip ─────────────────────────────────────────────────────────────────

function KpiChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-base font-bold" style={{ color: color ?? 'var(--text)' }}>{value}</p>
    </div>
  )
}
