'use client'

import { useState } from 'react'
import { useStore } from '@/lib/state/store'
import { createClient } from '@/lib/supabase/client'
import { callAgent, extractJSON } from '@/lib/gemini/agent'
import { saveSalesProfile } from '@/lib/supabase/queries/vendas'
import type { SalesProfile } from '@/types/app'

const QUESTIONS = [
  { q: 'Qual é o ticket médio das suas vendas?',                                          ph: 'Ex: R$ 500, R$ 5.000, varia muito...' },
  { q: 'Quantas vendas você fecha por mês em média?',                                     ph: 'Ex: 10 vendas, 2 projetos, menos de 5...' },
  { q: 'Qual é o seu principal canal de captação de clientes?',                           ph: 'Ex: Instagram, indicações, Google, outbound...' },
  { q: 'Em qual etapa você perde mais clientes?',                                         ph: 'Ex: no orçamento, depois da proposta, no follow-up...' },
  { q: 'Você tem um processo de follow-up estruturado?',                                  ph: 'Ex: sim com CRM / faço no WhatsApp / não tenho...' },
  { q: 'Qual é o tempo médio do seu ciclo de vendas (do 1º contato ao fechamento)?',     ph: 'Ex: 1 semana, 1 mês, depende do cliente...' },
  { q: 'Qual é a sua maior dificuldade em vendas hoje?',                                  ph: 'Ex: gerar leads, convencer no preço, fidelizar...' },
  { q: 'Você usa algum roteiro ou script de vendas?',                                     ph: 'Ex: tenho script básico / improviso / estou desenvolvendo...' },
  { q: 'Qual a taxa de conversão aproximada de leads em clientes?',                       ph: 'Ex: 30%, 1 em cada 5, não sei estimar...' },
  { q: 'Quais são os 2-3 principais argumentos que você usa para fechar uma venda?',     ph: 'Ex: qualidade do serviço, resultado garantido, preço justo...' },
]

const SYSTEM_PROMPT = `Você é um consultor de vendas sênior especializado em pequenos negócios brasileiros.
Analise o processo de vendas com base nas respostas e retorne um JSON com exatamente esta estrutura:
{
  "summary": "Parágrafo de 2-3 frases avaliando o estágio comercial",
  "weaknesses": ["Fraqueza 1", "Fraqueza 2", "Fraqueza 3"],
  "actions": ["Ação prioritária 1", "Ação 2", "Ação 3", "Ação 4", "Ação 5"]
}
Responda SOMENTE o JSON, sem texto antes ou depois.`

export function DiagnosticoVendas() {
  const salesAnswers = useStore(s => s.salesAnswers)
  const salesProfile = useStore(s => s.salesProfile)
  const formData     = useStore(s => s.formData)
  const companyId    = useStore(s => s.companyId)

  const setSalesAnswers = useStore(s => s.setSalesAnswers)
  const setSalesProfile = useStore(s => s.setSalesProfile)

  const [step, setStep]       = useState(0)
  const [answers, setAnswers] = useState<string[]>(salesAnswers.length === 10 ? salesAnswers : Array(10).fill(''))
  const [current, setCurrent] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView]       = useState<'form' | 'result'>(salesProfile ? 'result' : 'form')

  function handleStart() {
    setAnswers(Array(10).fill(''))
    setCurrent('')
    setStep(0)
    setView('form')
  }

  async function handleNext() {
    if (!current.trim()) return

    const next = [...answers]
    next[step] = current.trim()
    setAnswers(next)
    setCurrent('')

    if (step < 9) {
      setStep(s => s + 1)
      return
    }

    // All 10 answered — call Gemini
    setLoading(true)
    setSalesAnswers(next)

    const prompt = QUESTIONS.map((q, i) => `${i + 1}. ${q.q}\nR: ${next[i]}`).join('\n\n')
    const ctx    = { company: formData.companyName, segment: formData.segment, salesModel: formData.salesModel }

    const raw = await callAgent({
      module:       'vendas',
      systemPrompt: SYSTEM_PROMPT,
      userMessage:  `Analise o processo de vendas desta empresa:\n\n${prompt}`,
      context:      ctx,
    })

    const parsed = extractJSON<{ summary: string; weaknesses: string[]; actions: string[] }>(raw)
    const profile: SalesProfile = {
      summary:    parsed?.summary    ?? raw.slice(0, 400),
      weaknesses: parsed?.weaknesses ?? [],
      actions:    parsed?.actions    ?? [],
      answers:    next,
    }

    setSalesProfile(profile)

    if (companyId) {
      const supa = createClient()
      await saveSalesProfile(supa, companyId, next, profile)
    }

    setLoading(false)
    setView('result')
  }

  // ── Result view ───────────────────────────────────────────────────────────
  if (view === 'result' && salesProfile) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Perfil comercial</h3>
          <button
            onClick={handleStart}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            Refazer diagnóstico
          </button>
        </div>

        <div className="rounded-xl p-4 space-y-2"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Avaliação geral</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{salesProfile.summary}</p>
        </div>

        {salesProfile.weaknesses.length > 0 && (
          <div className="rounded-xl p-4 space-y-2"
               style={{ background: 'var(--surface)', border: '1px solid rgba(239,68,68,.3)' }}>
            <p className="text-xs font-medium uppercase" style={{ color: '#ef4444' }}>Pontos de melhoria</p>
            <ul className="space-y-1.5">
              {salesProfile.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text)' }}>
                  <span style={{ color: '#ef4444' }}>✗</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {salesProfile.actions.length > 0 && (
          <div className="rounded-xl p-4 space-y-2"
               style={{ background: 'var(--surface)', border: '1px solid rgba(16,185,129,.3)' }}>
            <p className="text-xs font-medium uppercase" style={{ color: '#10b981' }}>Plano de ação</p>
            <ol className="space-y-2">
              {salesProfile.actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text)' }}>
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: '#10b981' }}>
                    {i + 1}
                  </span>
                  {a}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    )
  }

  // ── Form view ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
             style={{ borderTopColor: 'var(--vd)' }} />
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Analisando seu processo de vendas...</p>
      </div>
    )
  }

  const q = QUESTIONS[step]
  const progress = ((step) / 10) * 100

  return (
    <div className="max-w-lg space-y-6">
      {!salesProfile && step === 0 && (
        <div className="rounded-xl p-4"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text)' }}>
            Responda 10 perguntas rápidas sobre seu processo comercial. A IA vai gerar um diagnóstico personalizado com pontos de melhoria e plano de ação.
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
          <span>Pergunta {step + 1} de 10</span>
          <span>{step * 10}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-300"
               style={{ width: `${progress}%`, background: 'var(--vd)' }} />
        </div>
      </div>

      {/* Question */}
      <div className="space-y-3">
        <p className="text-base font-medium" style={{ color: 'var(--text)' }}>{q.q}</p>
        <textarea
          value={current}
          onChange={e => setCurrent(e.target.value)}
          placeholder={q.ph}
          rows={3}
          autoFocus
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleNext() }}
        />
        <p className="text-xs" style={{ color: 'var(--muted)' }}>⌘ + Enter para avançar</p>
      </div>

      <div className="flex gap-2">
        {step > 0 && (
          <button
            onClick={() => { setStep(s => s - 1); setCurrent(answers[step - 1] ?? '') }}
            className="px-4 py-2.5 rounded-xl text-sm"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            ← Voltar
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!current.trim()}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: 'var(--vd)' }}
        >
          {step < 9 ? 'Próxima →' : 'Gerar diagnóstico'}
        </button>
      </div>
    </div>
  )
}
