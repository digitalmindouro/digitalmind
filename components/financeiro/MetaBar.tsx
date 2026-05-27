'use client'

import { useState } from 'react'
import { fmtBRL } from '@/lib/utils/formatters'
import { createClient } from '@/lib/supabase/client'
import { patchIntelligence } from '@/lib/supabase/queries/persist'
import { useStore } from '@/lib/state/store'

interface Props {
  meta: number | null
  progress: number   // 0-100
  receita: number    // receita do mês
}

export function MetaBar({ meta, progress, receita }: Props) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')
  const [saving, setSaving] = useState(false)

  const setFinMeta = useStore(s => s.setFinMeta)
  const companyId  = useStore(s => s.companyId)

  async function handleSave() {
    const val = parseFloat(raw.replace(',', '.'))
    if (isNaN(val) || val <= 0 || !companyId) { setEditing(false); return }

    setSaving(true)
    const supa = createClient()
    setFinMeta(val)
    await patchIntelligence(supa, companyId, { finMeta: val })
    setSaving(false)
    setEditing(false)
  }

  const color = progress >= 100 ? '#10b981' : progress >= 70 ? '#f59e0b' : '#6366f1'

  return (
    <div className="rounded-xl p-4 space-y-3"
         style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Meta de receita mensal</p>
          {meta ? (
            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
              {fmtBRL(receita)} de {fmtBRL(meta)}
            </p>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhuma meta definida</p>
          )}
        </div>

        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={raw}
              onChange={e => setRaw(e.target.value)}
              placeholder="Ex: 10000"
              autoFocus
              className="w-32 rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {saving ? '...' : 'Salvar'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setRaw(meta ? String(meta) : ''); setEditing(true) }}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            {meta ? 'Editar meta' : 'Definir meta'}
          </button>
        )}
      </div>

      {meta && meta > 0 && (
        <>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%`, background: color }}
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {progress.toFixed(0)}% atingido{progress >= 100 ? ' ✓' : ''}
          </p>
        </>
      )}
    </div>
  )
}
