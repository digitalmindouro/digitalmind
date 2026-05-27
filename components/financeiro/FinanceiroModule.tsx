'use client'

import { useState } from 'react'
import { useStore } from '@/lib/state/store'
import { KpiCards } from './KpiCards'
import { MetaBar } from './MetaBar'
import { TransactionForm } from './TransactionForm'
import { TransactionList } from './TransactionList'
import { EvolucaoChart, DespesasChart, ProjecaoChart } from './Charts'
import { DRE } from './DRE'
import {
  calcKPIs,
  calcMonthlyEvolution,
  calcCategoryBreakdown,
  calcProjection,
} from '@/lib/utils/financeiro'

type Tab = 'visao-geral' | 'lancamentos' | 'dre'

export function FinanceiroModule() {
  const [tab, setTab]           = useState<Tab>('visao-geral')
  const [showForm, setShowForm] = useState(false)
  const [filtroTodos, setFiltroTodos] = useState(false)

  const transactions = useStore(s => s.transactions)
  const finMeta      = useStore(s => s.finMeta)
  const categories   = useStore(s => s.categories)
  const contacts     = useStore(s => s.contacts)
  const products     = useStore(s => s.products)
  const companyId    = useStore(s => s.companyId)
  const user         = useStore(s => s.user)

  const kpis        = calcKPIs(transactions, finMeta)
  const monthly     = calcMonthlyEvolution(transactions, 6)
  const expenseCats = calcCategoryBreakdown(transactions, 'despesa')
  const projection  = calcProjection(transactions, 4, 3)

  const TABS: { id: Tab; label: string }[] = [
    { id: 'visao-geral', label: 'Visão Geral' },
    { id: 'lancamentos', label: 'Lançamentos' },
    { id: 'dre',         label: 'DRE' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Financeiro</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {transactions.length} transaç{transactions.length === 1 ? 'ão' : 'ões'} registradas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* periodo toggle (só na aba visão geral) */}
          {tab === 'visao-geral' && (
            <button
              onClick={() => setFiltroTodos(f => !f)}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{
                background: filtroTodos ? 'var(--surface-2)' : 'transparent',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {filtroTodos ? 'Período total' : 'Este mês'}
            </button>
          )}

          <button
            onClick={() => { setShowForm(f => !f); setTab('lancamentos') }}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--fn)' }}
          >
            + Nova transação
          </button>
        </div>
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
              borderBottom: tab === t.id ? '2px solid var(--fn)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── VISÃO GERAL ─────────────────────────────────────────── */}
      {tab === 'visao-geral' && (
        <div className="space-y-4">
          <KpiCards kpis={kpis} filtroTodos={filtroTodos} />

          <MetaBar
            meta={finMeta}
            progress={kpis.metaProgress}
            receita={kpis.receitaMes}
          />

          {/* Gráficos lado a lado */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4"
                 style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>
                Evolução mensal
              </p>
              <EvolucaoChart data={monthly} />
            </div>

            <div className="rounded-xl p-4"
                 style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>
                Composição de despesas
              </p>
              <DespesasChart
                data={expenseCats}
                total={expenseCats.reduce((s, c) => s + c.value, 0)}
              />
            </div>
          </div>

          {/* Projeção */}
          <div className="rounded-xl p-4"
               style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>
              Projeção — próximos 3 meses (média histórica)
            </p>
            <ProjecaoChart data={projection} />
          </div>
        </div>
      )}

      {/* ── LANÇAMENTOS ─────────────────────────────────────────── */}
      {tab === 'lancamentos' && (
        <div className="space-y-4">
          {/* Form */}
          {showForm && companyId && user ? (
            <TransactionForm
              categories={categories}
              contacts={contacts}
              products={products}
              companyId={companyId}
              userId={user.id}
              onClose={() => setShowForm(false)}
            />
          ) : !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-xl py-3 text-sm transition-colors"
              style={{ color: 'var(--muted)', border: '1px dashed var(--border)' }}
            >
              + Adicionar transação
            </button>
          ) : null}

          <TransactionList transactions={transactions} />
        </div>
      )}

      {/* ── DRE ─────────────────────────────────────────────────── */}
      {tab === 'dre' && (
        <DRE transactions={transactions} />
      )}
    </div>
  )
}
