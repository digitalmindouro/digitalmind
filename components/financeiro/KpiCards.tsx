'use client'

import { fmtBRL } from '@/lib/utils/formatters'
import type { KPIs } from '@/lib/utils/financeiro'

interface Props { kpis: KPIs; filtroTodos: boolean }

interface CardProps {
  label: string
  value: string
  sub?: string
  positive?: boolean | null  // null = neutral
}

function Card({ label, value, sub, positive }: CardProps) {
  const color = positive === null || positive === undefined
    ? 'var(--text)'
    : positive ? '#10b981' : '#ef4444'

  return (
    <div className="rounded-xl p-4 flex flex-col gap-1"
         style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--muted)' }}>{sub}</p>}
    </div>
  )
}

export function KpiCards({ kpis, filtroTodos }: Props) {
  const { receitaMes, despesaMes, saldoMes, margemMes, receitaTotal, despesaTotal, saldoTotal } = kpis
  const suffix = filtroTodos ? '(total)' : '(este mês)'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card
        label={`Receitas ${suffix}`}
        value={fmtBRL(filtroTodos ? receitaTotal : receitaMes)}
        positive={true}
      />
      <Card
        label={`Despesas ${suffix}`}
        value={fmtBRL(filtroTodos ? despesaTotal : despesaMes)}
        positive={false}
      />
      <Card
        label={`Saldo ${suffix}`}
        value={fmtBRL(filtroTodos ? saldoTotal : saldoMes)}
        positive={(filtroTodos ? saldoTotal : saldoMes) >= 0}
      />
      <Card
        label="Margem líquida"
        value={`${margemMes.toFixed(1)}%`}
        sub="sobre receitas do mês"
        positive={margemMes >= 0}
      />
    </div>
  )
}
