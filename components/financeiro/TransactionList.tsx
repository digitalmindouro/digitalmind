'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deleteTransaction } from '@/lib/supabase/queries/financeiro'
import { useStore } from '@/lib/state/store'
import { fmtBRL } from '@/lib/utils/formatters'
import { calcMonthlyEvolution } from '@/lib/utils/financeiro'
import type { Transaction } from '@/types/app'

interface Props { transactions: Transaction[] }

const PAGE_SIZE = 25

export function TransactionList({ transactions }: Props) {
  const removeTransaction = useStore(s => s.removeTransaction)

  const [filtroTipo, setFiltroTipo]   = useState<'todos' | 'receita' | 'despesa'>('todos')
  const [filtroMes, setFiltroMes]     = useState('')
  const [busca, setBusca]             = useState('')
  const [page, setPage]               = useState(1)
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [confirming, setConfirming]   = useState<string | null>(null)

  const months = calcMonthlyEvolution(transactions, 6)

  // Filter
  const filtered = transactions
    .filter(t => filtroTipo === 'todos' || t.tipo === filtroTipo)
    .filter(t => !filtroMes || t.dataISO.startsWith(filtroMes))
    .filter(t => !busca || t.desc.toLowerCase().includes(busca.toLowerCase()) || t.cat.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => b.dataISO.localeCompare(a.dataISO))

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const visible    = filtered.slice(0, page * PAGE_SIZE)

  async function handleDelete(id: string) {
    if (confirming !== id) { setConfirming(id); return }
    setDeletingId(id)
    const supa = createClient()
    await deleteTransaction(supa, id)
    removeTransaction(id)
    setDeletingId(null)
    setConfirming(null)
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* tipo */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {(['todos', 'receita', 'despesa'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setFiltroTipo(t); setPage(1) }}
              className="px-3 py-1.5 text-xs font-medium capitalize transition-colors"
              style={{
                background: filtroTipo === t ? 'var(--accent)' : 'var(--surface-2)',
                color: filtroTipo === t ? '#fff' : 'var(--muted)',
              }}
            >
              {t === 'todos' ? 'Todos' : t === 'receita' ? '↑ Receitas' : '↓ Despesas'}
            </button>
          ))}
        </div>

        {/* mês */}
        <select
          value={filtroMes}
          onChange={e => { setFiltroMes(e.target.value); setPage(1) }}
          className="rounded-lg px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: filtroMes ? 'var(--text)' : 'var(--muted)' }}
        >
          <option value="">Todos os meses</option>
          {months.map(m => <option key={m.key} value={m.key}>{m.label} {m.key.slice(0, 4)}</option>)}
        </select>

        {/* busca */}
        <input
          type="text"
          value={busca}
          onChange={e => { setBusca(e.target.value); setPage(1) }}
          placeholder="Buscar..."
          className="flex-1 min-w-[140px] rounded-lg px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      </div>

      {/* Count */}
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        {filtered.length} transaç{filtered.length === 1 ? 'ão' : 'ões'}
      </p>

      {/* List */}
      {visible.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ border: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhuma transação encontrada.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {visible.map((t, i) => {
            const isReceita = t.tipo === 'receita'
            const isDeleting = deletingId === t.id
            const isConfirming = confirming === t.id

            return (
              <div
                key={t.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors"
                style={{
                  background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
                  borderBottom: i < visible.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {/* indicator */}
                <div className="w-1.5 h-10 rounded-full shrink-0"
                     style={{ background: isReceita ? '#10b981' : '#ef4444' }} />

                {/* info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {t.desc}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {t.cat ? `${t.cat} · ` : ''}{t.data}
                  </p>
                </div>

                {/* value */}
                <p className="text-sm font-semibold tabular-nums shrink-0"
                   style={{ color: isReceita ? '#10b981' : '#ef4444' }}>
                  {isReceita ? '+' : '-'}{fmtBRL(t.valor)}
                </p>

                {/* delete */}
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={isDeleting}
                  className="text-xs px-2 py-1 rounded transition-colors shrink-0"
                  style={{
                    color: isConfirming ? '#ef4444' : 'var(--muted)',
                    background: isConfirming ? 'rgba(239,68,68,.1)' : 'transparent',
                  }}
                  title={isConfirming ? 'Clique para confirmar exclusão' : 'Excluir'}
                  onBlur={() => { if (confirming === t.id) setConfirming(null) }}
                >
                  {isDeleting ? '...' : isConfirming ? 'Confirmar?' : '×'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Load more */}
      {page < totalPages && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="w-full py-2.5 rounded-xl text-sm transition-colors"
          style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          Mostrar mais ({filtered.length - visible.length} restantes)
        </button>
      )}
    </div>
  )
}
