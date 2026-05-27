import type { Transaction } from '@/types/app'

const MES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export function mesLabel(iso: string): string {
  const [, m] = iso.split('-')
  return MES[parseInt(m, 10) - 1] ?? iso
}

export function thisMonthKey(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

// ─── KPIs ────────────────────────────────────────────────────────────────────

export interface KPIs {
  receitaMes: number
  despesaMes: number
  saldoMes: number
  margemMes: number   // percent, can be negative
  receitaTotal: number
  despesaTotal: number
  saldoTotal: number
  metaProgress: number // 0-100
}

export function calcKPIs(transactions: Transaction[], finMeta: number | null): KPIs {
  const mes = thisMonthKey()
  const mesTxns = transactions.filter(t => t.dataISO.startsWith(mes))

  const receitaMes = mesTxns.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const despesaMes = mesTxns.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const saldoMes   = receitaMes - despesaMes
  const margemMes  = receitaMes > 0 ? (saldoMes / receitaMes) * 100 : 0

  const receitaTotal = transactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const despesaTotal = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const saldoTotal   = receitaTotal - despesaTotal

  const metaProgress = finMeta && finMeta > 0 ? Math.min(100, (receitaMes / finMeta) * 100) : 0

  return { receitaMes, despesaMes, saldoMes, margemMes, receitaTotal, despesaTotal, saldoTotal, metaProgress }
}

// ─── Evolução mensal ─────────────────────────────────────────────────────────

export interface MonthlyPoint {
  key: string     // "2024-05"
  label: string   // "Mai"
  receita: number
  despesa: number
  saldo: number
}

export function calcMonthlyEvolution(transactions: Transaction[], months = 6): MonthlyPoint[] {
  const now = new Date()
  const result: MonthlyPoint[] = []

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = MES[d.getMonth()]
    const txns  = transactions.filter(t => t.dataISO.startsWith(key))
    const receita = txns.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
    const despesa = txns.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
    result.push({ key, label, receita, despesa, saldo: receita - despesa })
  }

  return result
}

// ─── Breakdown por categoria ─────────────────────────────────────────────────

export interface CategoryPoint {
  name: string
  value: number
  percent: number
}

export function calcCategoryBreakdown(
  transactions: Transaction[],
  tipo: 'receita' | 'despesa',
  monthKey?: string,
): CategoryPoint[] {
  let txns = transactions.filter(t => t.tipo === tipo)
  if (monthKey) txns = txns.filter(t => t.dataISO.startsWith(monthKey))

  const total = txns.reduce((s, t) => s + t.valor, 0)
  if (total === 0) return []

  const map: Record<string, number> = {}
  for (const t of txns) {
    const cat = t.cat || 'Sem categoria'
    map[cat] = (map[cat] ?? 0) + t.valor
  }

  return Object.entries(map)
    .map(([name, value]) => ({ name, value, percent: (value / total) * 100 }))
    .sort((a, b) => b.value - a.value)
}

// ─── Projeção ─────────────────────────────────────────────────────────────────

export interface ProjectionPoint {
  label: string
  receita: number | null
  despesa: number | null
  receitaProj: number | null
  despesaProj: number | null
  isProjected: boolean
}

export function calcProjection(transactions: Transaction[], historyMonths = 4, projMonths = 3): ProjectionPoint[] {
  const history = calcMonthlyEvolution(transactions, historyMonths)
  const result: ProjectionPoint[] = history.map(m => ({
    label: m.label,
    receita: m.receita,
    despesa: m.despesa,
    receitaProj: null,
    despesaProj: null,
    isProjected: false,
  }))

  // Average from last 3 history points
  const sample = history.slice(-3)
  const avgReceita = sample.length ? sample.reduce((s, m) => s + m.receita, 0) / sample.length : 0
  const avgDespesa = sample.length ? sample.reduce((s, m) => s + m.despesa, 0) / sample.length : 0

  const now = new Date()
  for (let i = 1; i <= projMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    result.push({
      label: MES[d.getMonth()],
      receita: null,
      despesa: null,
      receitaProj: Math.round(avgReceita),
      despesaProj: Math.round(avgDespesa),
      isProjected: true,
    })
  }

  return result
}

// ─── DRE ─────────────────────────────────────────────────────────────────────

export interface DRELine {
  label: string
  value: number
  isHeader?: boolean
  isTotal?: boolean
  indent?: boolean
}

export function calcDRE(transactions: Transaction[], monthKey?: string): DRELine[] {
  const txns = monthKey ? transactions.filter(t => t.dataISO.startsWith(monthKey)) : transactions

  const receitas = txns.filter(t => t.tipo === 'receita')
  const despesas = txns.filter(t => t.tipo === 'despesa')

  const totalReceitas = receitas.reduce((s, t) => s + t.valor, 0)
  const totalDespesas = despesas.reduce((s, t) => s + t.valor, 0)
  const resultado     = totalReceitas - totalDespesas
  const margem        = totalReceitas > 0 ? (resultado / totalReceitas) * 100 : 0

  function groupByCat(txs: Transaction[]): Record<string, number> {
    const m: Record<string, number> = {}
    for (const t of txs) { const k = t.cat || 'Sem categoria'; m[k] = (m[k] ?? 0) + t.valor }
    return m
  }

  const recCats = groupByCat(receitas)
  const depCats = groupByCat(despesas)

  return [
    { label: 'RECEITAS', value: totalReceitas, isHeader: true },
    ...Object.entries(recCats).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, indent: true })),
    { label: 'DESPESAS', value: totalDespesas, isHeader: true },
    ...Object.entries(depCats).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, indent: true })),
    { label: 'RESULTADO', value: resultado, isTotal: true },
    { label: `Margem líquida`, value: margem, isTotal: true },
  ]
}
