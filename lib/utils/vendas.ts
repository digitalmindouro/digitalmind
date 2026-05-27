import { daysSince } from '@/lib/utils/formatters'
import type { CrmLead, SalesGoal } from '@/types/app'

export type Stage = CrmLead['stage']

export const STAGE_CONFIG: Record<Stage, { label: string; color: string; bg: string }> = {
  novo:     { label: 'Novo',        color: '#6366f1', bg: 'rgba(99,102,241,.12)'  },
  conversa: { label: 'Em conversa', color: '#f59e0b', bg: 'rgba(245,158,11,.12)'  },
  proposta: { label: 'Proposta',    color: '#3b82f6', bg: 'rgba(59,130,246,.12)'  },
  fechado:  { label: 'Fechado',     color: '#10b981', bg: 'rgba(16,185,129,.12)'  },
  perdido:  { label: 'Perdido',     color: '#ef4444', bg: 'rgba(239,68,68,.12)'   },
}

export const STAGES: Stage[] = ['novo', 'conversa', 'proposta', 'fechado', 'perdido']

// Parse "R$ 1.500" or "1500" → number
export function parseLeadValue(val: string): number {
  const n = parseFloat(val.replace(/[R$\s.]/g, '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

// Contact staleness in days (0 if no date)
export function daysNoContact(lead: CrmLead): number {
  if (!lead.lastContact) return 999
  return daysSince(lead.lastContact)
}

// Color for days-without-contact indicator
export function contactColor(days: number): string {
  if (days <= 3)  return '#10b981'
  if (days <= 7)  return '#f59e0b'
  return '#ef4444'
}

// Pipeline = active stages (excludes fechado and perdido from value sum)
export interface KanbanKPIs {
  total: number
  pipelineValue: number    // sum of values in novo+conversa+proposta
  fechadoCount: number
  conversionRate: number   // fechados / (fechados + perdidos), 0-100
  leadsAlerts: number      // leads with > 7 days no contact in active stages
}

export function calcKanbanKPIs(leads: CrmLead[]): KanbanKPIs {
  const active   = leads.filter(l => !['fechado','perdido'].includes(l.stage))
  const fechados = leads.filter(l => l.stage === 'fechado')
  const perdidos = leads.filter(l => l.stage === 'perdido')

  const total         = leads.length
  const pipelineValue = active.reduce((s, l) => s + parseLeadValue(l.value), 0)
  const fechadoCount  = fechados.length
  const denominator   = fechados.length + perdidos.length
  const conversionRate = denominator > 0 ? (fechados.length / denominator) * 100 : 0
  const leadsAlerts   = active.filter(l => daysNoContact(l) > 7).length

  return { total, pipelineValue, fechadoCount, conversionRate, leadsAlerts }
}

export function calcGoalProgress(goal: SalesGoal): number {
  return goal.target > 0 ? Math.min(100, (goal.done / goal.target) * 100) : 0
}
