'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/state/store'
import { createClient } from '@/lib/supabase/client'
import { persistCalendar } from '@/lib/supabase/queries/marketing'
import { uuid } from '@/lib/utils/uuid'
import { toISODate } from '@/lib/utils/formatters'
import { FORMAT_CONFIG, FORMATS, PLATFORMS } from '@/lib/utils/marketing'
import type { CalendarEvent, ContentCalendar } from '@/types/app'

interface Props {
  event: CalendarEvent | null   // null = criar novo
  date: string                  // "YYYY-MM-DD" — data inicial
  onClose: () => void
}

const EMPTY_FORM = {
  titulo: '',
  descricao: '',
  hora: '',
  formato: 'post' as CalendarEvent['formato'],
  plataforma: 'instagram',
  status: 'agendado' as CalendarEvent['status'],
  note: '',
}

export function EventoModal({ event, date, onClose }: Props) {
  const contentCalendar    = useStore(s => s.contentCalendar)
  const setContentCalendar = useStore(s => s.setContentCalendar)
  const companyId          = useStore(s => s.companyId)

  const isEdit = event !== null
  const [form, setForm] = useState({ ...EMPTY_FORM, ...event, date })
  const [saving, setSaving]     = useState(false)
  const [confirming, setConfirm] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function patch<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function applyCalendarChange(cal: ContentCalendar): ContentCalendar {
    const next: ContentCalendar = { ...cal }

    // If editing and date changed → remove from old date
    if (isEdit && date !== form.date) {
      const old = (next[date] ?? []).filter(e => e.id !== event!.id)
      if (old.length) next[date] = old
      else delete next[date]
    }

    const targetDate = form.date || date
    const existing = (next[targetDate] ?? []).filter(e => e.id !== (event?.id ?? ''))
    const saved: CalendarEvent = {
      id:          event?.id ?? uuid(),
      titulo:      form.titulo.trim() || form.formato,
      descricao:   form.descricao,
      hora:        form.hora,
      formato:     form.formato,
      type:        form.formato,           // mirrors formato
      plataforma:  form.plataforma,
      status:      form.status,
      note:        form.note,
    }
    next[targetDate] = [...existing, saved]
    return next
  }

  async function handleSave() {
    setSaving(true)
    const next = applyCalendarChange(contentCalendar)
    setContentCalendar(next)

    if (companyId) {
      const supa = createClient()
      await persistCalendar(supa, companyId, next)
    }

    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!isEdit) return
    const next: ContentCalendar = { ...contentCalendar }
    const remaining = (next[date] ?? []).filter(e => e.id !== event!.id)
    if (remaining.length) next[date] = remaining
    else delete next[date]

    setContentCalendar(next)

    if (companyId) {
      const supa = createClient()
      await persistCalendar(supa, companyId, next)
    }

    onClose()
  }

  const fmtConf = FORMAT_CONFIG[form.formato]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
             style={{ borderBottom: '1px solid var(--border)', background: `${fmtConf.color}14` }}>
          <div>
            <p className="text-xs font-medium" style={{ color: fmtConf.color }}>
              {isEdit ? 'Editar conteúdo' : 'Novo conteúdo'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{form.date}</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* formato + plataforma */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Formato</label>
              <div className="flex flex-wrap gap-1">
                {FORMATS.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => patch('formato', f)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: form.formato === f ? FORMAT_CONFIG[f].color : 'var(--surface-2)',
                      color: form.formato === f ? '#fff' : 'var(--muted)',
                    }}
                  >
                    {FORMAT_CONFIG[f].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Plataforma</label>
              <select
                value={form.plataforma}
                onChange={e => patch('plataforma', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none capitalize"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {PLATFORMS.map(p => (
                  <option key={p} value={p} className="capitalize">{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* data + hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Data *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => patch('date', e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Hora</label>
              <input
                type="time"
                value={form.hora}
                onChange={e => patch('hora', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>

          {/* título */}
          <div className="space-y-1">
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Título</label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => patch('titulo', e.target.value)}
              placeholder="Ex: 3 dicas para aumentar vendas"
              autoFocus={!isEdit}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          {/* descrição */}
          <div className="space-y-1">
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Descrição / legenda</label>
            <textarea
              value={form.descricao}
              onChange={e => patch('descricao', e.target.value)}
              placeholder="Ideia do conteúdo, palavras-chave, CTA..."
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm resize-none outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          {/* nota interna */}
          <div className="space-y-1">
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Nota interna</label>
            <input
              type="text"
              value={form.note}
              onChange={e => patch('note', e.target.value)}
              placeholder="Observações de produção..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          {/* status */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['agendado', 'publicado'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => patch('status', s)}
                className="flex-1 py-2 text-sm font-medium capitalize transition-colors"
                style={{
                  background: form.status === s
                    ? (s === 'publicado' ? '#10b981' : 'var(--mk)')
                    : 'var(--surface-2)',
                  color: form.status === s ? '#fff' : 'var(--muted)',
                }}
              >
                {s === 'agendado' ? '📅 Agendado' : '✓ Publicado'}
              </button>
            ))}
          </div>

          {/* actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !form.date}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: 'var(--mk)' }}
            >
              {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Adicionar ao calendário'}
            </button>
          </div>

          {isEdit && (
            confirming ? (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#ef4444' }}
                >
                  Confirmar exclusão
                </button>
                <button
                  onClick={() => setConfirm(false)}
                  className="px-4 rounded-xl text-sm"
                  style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirm(true)}
                className="w-full py-2 rounded-xl text-sm"
                style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,.3)' }}
              >
                Remover do calendário
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
