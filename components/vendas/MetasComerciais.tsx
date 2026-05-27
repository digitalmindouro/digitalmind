'use client'

import { useState } from 'react'
import { useStore } from '@/lib/state/store'
import { createClient } from '@/lib/supabase/client'
import { persistGoals } from '@/lib/supabase/queries/vendas'
import { calcGoalProgress } from '@/lib/utils/vendas'
import { fmtBRL } from '@/lib/utils/formatters'
import { uuid } from '@/lib/utils/uuid'
import type { SalesGoal } from '@/types/app'

export function MetasComerciais() {
  const salesGoals    = useStore(s => s.salesGoals)
  const upsertSalesGoal = useStore(s => s.upsertSalesGoal)
  const removeSalesGoal = useStore(s => s.removeSalesGoal)
  const companyId     = useStore(s => s.companyId)

  const [showForm, setShowForm] = useState(false)
  const [label, setLabel]       = useState('')
  const [target, setTarget]     = useState('')
  const [saving, setSaving]     = useState(false)

  // For updating progress inline
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [doneRaw, setDoneRaw]       = useState('')

  async function persist(goals: SalesGoal[]) {
    if (!companyId) return
    const supa = createClient()
    await persistGoals(supa, companyId, goals)
  }

  async function handleCreate() {
    const t = parseFloat(target.replace(',', '.'))
    if (!label.trim() || isNaN(t) || t <= 0) return
    setSaving(true)

    const goal: SalesGoal = { id: uuid(), label: label.trim(), target: t, done: 0 }
    upsertSalesGoal(goal)
    await persist([...salesGoals, goal])

    setLabel('')
    setTarget('')
    setShowForm(false)
    setSaving(false)
  }

  async function handleUpdateDone(goal: SalesGoal) {
    const done = parseFloat(doneRaw.replace(',', '.'))
    if (isNaN(done) || done < 0) { setUpdatingId(null); return }

    const updated = { ...goal, done }
    upsertSalesGoal(updated)
    await persist(salesGoals.map(g => g.id === goal.id ? updated : g))

    setUpdatingId(null)
    setDoneRaw('')
  }

  async function handleDelete(id: string) {
    removeSalesGoal(id)
    await persist(salesGoals.filter(g => g.id !== id))
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Metas comerciais</h3>
        <button
          onClick={() => setShowForm(f => !f)}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--vd)' }}
        >
          + Nova meta
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl p-4 space-y-3"
             style={{ background: 'var(--surface)', border: '1px solid var(--vd)4d' }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Descrição da meta</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Ex: Fechar R$ 20.000 em vendas"
                autoFocus
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Valor alvo (R$)</label>
              <input
                type="number"
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="20000"
                min="0"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || !label.trim() || !target}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: 'var(--vd)' }}
            >
              {saving ? 'Salvando...' : 'Criar meta'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 rounded-lg text-sm"
              style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Goals list */}
      {salesGoals.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ border: '1px dashed var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Nenhuma meta definida. Crie sua primeira meta comercial.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {salesGoals.map(goal => {
            const pct   = calcGoalProgress(goal)
            const done  = goal.done
            const bar   = pct >= 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#6366f1'
            const isUpd = updatingId === goal.id

            return (
              <div key={goal.id} className="rounded-xl p-4 space-y-3"
                   style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{goal.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {fmtBRL(done)} de {fmtBRL(goal.target)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold" style={{ color: bar }}>
                      {pct.toFixed(0)}%
                    </span>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: 'var(--muted)' }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                       style={{ width: `${Math.min(100, pct)}%`, background: bar }} />
                </div>

                {/* Update progress */}
                {isUpd ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={doneRaw}
                      onChange={e => setDoneRaw(e.target.value)}
                      placeholder={`Valor atual (era ${fmtBRL(done)})`}
                      autoFocus
                      min="0"
                      className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      onKeyDown={e => { if (e.key === 'Enter') handleUpdateDone(goal); if (e.key === 'Escape') setUpdatingId(null) }}
                    />
                    <button
                      onClick={() => handleUpdateDone(goal)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ background: 'var(--vd)' }}
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setUpdatingId(null)}
                      className="px-3 rounded-lg text-xs"
                      style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setUpdatingId(goal.id); setDoneRaw(String(done)) }}
                    className="text-xs"
                    style={{ color: 'var(--muted)' }}
                  >
                    Atualizar progresso →
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
