'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/state/store'
import { createClient } from '@/lib/supabase/client'
import { persistLeads } from '@/lib/supabase/queries/vendas'
import { toISODate } from '@/lib/utils/formatters'
import { STAGE_CONFIG, STAGES, daysNoContact, contactColor } from '@/lib/utils/vendas'
import { uuid } from '@/lib/utils/uuid'
import type { CrmLead } from '@/types/app'

type Stage = CrmLead['stage']

interface Props {
  lead: CrmLead | null          // null = criar novo
  initialStage?: Stage          // para criação
  onClose: () => void
}

const EMPTY: Omit<CrmLead, 'id' | 'createdAt'> = {
  name: '', product: '', value: '', stage: 'novo',
  lastContact: '', nextContact: '', nextStep: '',
}

export function LeadModal({ lead, initialStage = 'novo', onClose }: Props) {
  const salesLeads    = useStore(s => s.salesLeads)
  const upsertCrmLead = useStore(s => s.upsertCrmLead)
  const removeCrmLead = useStore(s => s.removeCrmLead)
  const companyId     = useStore(s => s.companyId)

  const isNew = lead === null
  const [editing, setEditing]     = useState(isNew)
  const [confirming, setConfirm]  = useState(false)
  const [saving, setSaving]       = useState(false)

  const [form, setForm] = useState<Omit<CrmLead, 'id' | 'createdAt'>>(() =>
    lead ? {
      name: lead.name, product: lead.product, value: lead.value,
      stage: lead.stage, lastContact: lead.lastContact,
      nextContact: lead.nextContact, nextStep: lead.nextStep,
    } : { ...EMPTY, stage: initialStage }
  )

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function patch(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)

    const updated: CrmLead = {
      id:          lead?.id ?? uuid(),
      createdAt:   lead?.createdAt ?? toISODate(new Date()),
      ...form,
    }

    upsertCrmLead(updated)

    if (companyId) {
      const supa  = createClient()
      const next  = salesLeads
        .filter(l => l.id !== updated.id)
        .concat(updated)
      await persistLeads(supa, companyId, next)
    }

    setSaving(false)
    onClose()
  }

  async function handleLogContact() {
    if (!lead) return
    const updated = { ...lead, lastContact: toISODate(new Date()) }
    upsertCrmLead(updated)

    if (companyId) {
      const supa = createClient()
      const next = salesLeads.map(l => l.id === lead.id ? updated : l)
      await persistLeads(supa, companyId, next)
    }

    setForm(f => ({ ...f, lastContact: toISODate(new Date()) }))
  }

  async function handleDelete() {
    if (!lead) return
    removeCrmLead(lead.id)

    if (companyId) {
      const supa = createClient()
      await persistLeads(supa, companyId, salesLeads.filter(l => l.id !== lead.id))
    }

    onClose()
  }

  async function handleMoveStage(stage: Stage) {
    patch('stage', stage)
    if (!lead) return

    const updated = { ...lead, stage }
    upsertCrmLead(updated)

    if (companyId) {
      const supa = createClient()
      await persistLeads(supa, companyId, salesLeads.map(l => l.id === lead.id ? updated : l))
    }
  }

  const stageConf = STAGE_CONFIG[form.stage]
  const days      = lead ? daysNoContact(lead) : 0
  const dColor    = contactColor(days)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
             style={{ borderBottom: '1px solid var(--border)', background: stageConf.bg }}>
          <div>
            <p className="text-xs font-medium" style={{ color: stageConf.color }}>
              {stageConf.label}
            </p>
            <h3 className="font-semibold text-sm mt-0.5" style={{ color: 'var(--text)' }}>
              {isNew ? 'Novo lead' : (lead?.name || 'Lead')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                Editar
              </button>
            )}
            <button onClick={onClose} style={{ color: 'var(--muted)', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Days no contact badge (view mode) */}
          {!isNew && !editing && (
            <div className="flex items-center justify-between">
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: `${dColor}20`, color: dColor }}>
                {days === 999 ? 'Sem registro de contato' : days === 0 ? 'Contato hoje' : `${days} dia${days === 1 ? '' : 's'} sem contato`}
              </span>
              <button
                onClick={handleLogContact}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ color: '#10b981', border: '1px solid rgba(16,185,129,.3)' }}
              >
                ✓ Registrar contato
              </button>
            </div>
          )}

          {/* Fields */}
          {editing ? (
            <div className="space-y-3">
              <Field label="Nome / empresa *" value={form.name} onChange={v => patch('name', v)} placeholder="Nome do lead" />
              <Field label="Produto / serviço de interesse" value={form.product} onChange={v => patch('product', v)} placeholder="Ex: Site profissional" />
              <Field label="Valor estimado" value={form.value} onChange={v => patch('value', v)} placeholder="Ex: R$ 3.000" />
              <Field label="Próximo passo" value={form.nextStep} onChange={v => patch('nextStep', v)} placeholder="Ex: Enviar proposta na terça" />
              <div className="grid grid-cols-2 gap-3">
                <DateField label="Último contato" value={form.lastContact} onChange={v => patch('lastContact', v)} />
                <DateField label="Próximo contato" value={form.nextContact} onChange={v => patch('nextContact', v)} />
              </div>

              <div className="space-y-1">
                <label className="text-xs" style={{ color: 'var(--muted)' }}>Etapa</label>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => patch('stage', s)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        background: form.stage === s ? STAGE_CONFIG[s].color : 'var(--surface-2)',
                        color: form.stage === s ? '#fff' : 'var(--muted)',
                      }}
                    >
                      {STAGE_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* View mode */
            <div className="space-y-3">
              {lead?.product && <InfoRow label="Produto" value={lead.product} />}
              {lead?.value   && <InfoRow label="Valor"   value={lead.value} />}
              {lead?.nextStep && (
                <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Próximo passo</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{lead.nextStep}</p>
                </div>
              )}
              {lead?.nextContact && <InfoRow label="Próximo contato" value={lead.nextContact} />}
            </div>
          )}

          {/* Move stage (view mode) */}
          {!isNew && !editing && (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Mover para</p>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.filter(s => s !== form.stage).map(s => (
                  <button
                    key={s}
                    onClick={() => handleMoveStage(s)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: STAGE_CONFIG[s].bg, color: STAGE_CONFIG[s].color }}
                  >
                    → {STAGE_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {editing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: 'var(--vd)' }}
                >
                  {saving ? 'Salvando...' : isNew ? 'Criar lead' : 'Salvar'}
                </button>
                {!isNew && (
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 rounded-xl text-sm"
                    style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    Cancelar
                  </button>
                )}
              </>
            )}

            {!isNew && !editing && (
              confirming ? (
                <div className="flex gap-2 w-full">
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
                  Excluir lead
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs" style={{ color: 'var(--muted)' }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />
    </div>
  )
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs" style={{ color: 'var(--muted)' }}>{label}</label>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="text-sm" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  )
}
