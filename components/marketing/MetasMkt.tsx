'use client'

import { useState } from 'react'
import { useStore } from '@/lib/state/store'
import { createClient } from '@/lib/supabase/client'
import { persistMktGoals } from '@/lib/supabase/queries/marketing'
import { calcGoalProgress } from '@/lib/utils/marketing'
import type { MktGoals } from '@/types/app'

export function MetasMkt() {
  const contentCalendar = useStore(s => s.contentCalendar)
  const mktGoals        = useStore(s => s.mktGoals)
  const setMktGoals     = useStore(s => s.setMktGoals)
  const companyId       = useStore(s => s.companyId)

  const [editing, setEditing] = useState(false)
  const [weekTarget, setWeekTarget]   = useState(String(mktGoals.week?.target ?? ''))
  const [monthTarget, setMonthTarget] = useState(String(mktGoals.month?.target ?? ''))
  const [saving, setSaving] = useState(false)

  const progress = calcGoalProgress(contentCalendar, mktGoals)

  async function handleSave() {
    const wt = parseInt(weekTarget)
    const mt = parseInt(monthTarget)

    const updated: MktGoals = {
      week:  (!isNaN(wt) && wt > 0) ? { target: wt, label: 'publicações/semana', done: 0 } : undefined,
      month: (!isNaN(mt) && mt > 0) ? { target: mt, label: 'publicações/mês',    done: 0 } : undefined,
    }

    setSaving(true)
    setMktGoals(updated)

    if (companyId) {
      const supa = createClient()
      await persistMktGoals(supa, companyId, updated)
    }

    setSaving(false)
    setEditing(false)
  }

  function GoalCard({
    label, sub, done, target, color,
  }: {
    label: string; sub: string; done: number; target: number; color: string
  }) {
    const pct = target > 0 ? Math.min(100, (done / target) * 100) : 0
    const barColor = pct >= 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : color

    return (
      <div className="rounded-xl p-4 space-y-3"
           style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</p>
          </div>
          <span className="text-lg font-bold" style={{ color: barColor }}>
            {target > 0 ? `${done}/${target}` : '—'}
          </span>
        </div>

        {target > 0 && (
          <>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {pct.toFixed(0)}% concluído · {Math.max(0, target - done)} restante{target - done !== 1 ? 's' : ''}
            </p>
          </>
        )}

        {target === 0 && (
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Meta não definida</p>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Metas de publicação</h3>
        <button
          onClick={() => setEditing(f => !f)}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          {editing ? 'Cancelar' : 'Editar metas'}
        </button>
      </div>

      {editing ? (
        <div className="rounded-xl p-4 space-y-4"
             style={{ background: 'var(--surface)', border: '1px solid var(--mk)40' }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Publicações / semana</label>
              <input
                type="number"
                value={weekTarget}
                onChange={e => setWeekTarget(e.target.value)}
                placeholder="Ex: 5"
                min="0"
                autoFocus
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Publicações / mês</label>
              <input
                type="number"
                value={monthTarget}
                onChange={e => setMonthTarget(e.target.value)}
                placeholder="Ex: 20"
                min="0"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: 'var(--mk)' }}
          >
            {saving ? 'Salvando...' : 'Salvar metas'}
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <GoalCard
            label="Esta semana"
            sub="Publicações publicadas vs meta semanal"
            done={progress.weekPublished}
            target={progress.weekTarget}
            color="var(--mk)"
          />
          <GoalCard
            label="Este mês"
            sub="Publicações publicadas vs meta mensal"
            done={progress.monthPublished}
            target={progress.monthTarget}
            color="var(--mk)"
          />
        </div>
      )}
    </div>
  )
}
