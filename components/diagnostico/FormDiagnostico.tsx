'use client'

import { useState } from 'react'
import { useStore } from '@/lib/state/store'
import { createClient } from '@/lib/supabase/client'
import { callAgent, extractJSON } from '@/lib/gemini/agent'
import { saveCompanyFields, saveDiagnostic } from '@/lib/supabase/queries/diagnostico'
import type { DiagResult, FormData as AppFormData } from '@/types/app'

const STEPS = [
  { title: 'Empresa', fields: ['companyName', 'city'] },
  { title: 'Mercado',  fields: ['segment', 'marketTime'] },
  { title: 'Vendas',   fields: ['salesModel', 'leadSource'] },
  { title: 'Objetivos', fields: ['mainGoal', 'desiredAdvance'] },
  { title: 'Desafios',  fields: ['mainDifficulty', 'mainDiff'] },
  { title: 'Digital',   fields: ['digitalPresence'] },
]

const LABELS: Record<string, string> = {
  companyName:    'Nome da empresa',
  city:           'Cidade',
  segment:        'Segmento / nicho',
  marketTime:     'Tempo de mercado',
  salesModel:     'Modelo de vendas',
  leadSource:     'Principal canal de captação',
  mainGoal:       'Principal objetivo agora',
  desiredAdvance: 'O que quer avançar nos próximos 90 dias',
  mainDifficulty: 'Principal dificuldade',
  mainDiff:       'Diferencial do seu negócio',
  digitalPresence:'Presença digital atual (redes, site, etc.)',
}

const PLACEHOLDERS: Record<string, string> = {
  companyName:    'Ex: Minha Empresa LTDA',
  city:           'Ex: São Paulo - SP',
  segment:        'Ex: Estética, Consultoria, E-commerce...',
  marketTime:     'Ex: 2 anos, 6 meses...',
  salesModel:     'Ex: Presencial, Online, Híbrido',
  leadSource:     'Ex: Instagram, Indicação, Google...',
  mainGoal:       'Ex: Aumentar faturamento, estruturar processos...',
  desiredAdvance: 'Ex: Dobrar o número de clientes...',
  mainDifficulty: 'Ex: Consistência nas vendas, gestão do time...',
  mainDiff:       'Ex: Atendimento personalizado, preço-qualidade...',
  digitalPresence:'Ex: Instagram com 2k seguidores, sem site...',
}

const SYSTEM_PROMPT = `Você é um consultor empresarial especializado em pequenos negócios brasileiros.
Analise os dados da empresa e retorne um diagnóstico completo em JSON com exatamente este formato:
{
  "sc": <número 0-100>,
  "overview": "<parágrafo de 2-3 frases sobre o momento atual>",
  "summary": "<resumo executivo em 1 frase>",
  "gaps": ["<lacuna 1>","<lacuna 2>","<lacuna 3>"],
  "direction": "<direção estratégica recomendada>",
  "attention": "<ponto de atenção urgente>",
  "priorities": ["<prioridade 1>","<prioridade 2>","<prioridade 3>"],
  "nextMove": "<próxima ação concreta e específica>",
  "swot": ["<força 1>","<força 2>","<fraqueza 1>","<fraqueza 2>","<oportunidade 1>","<oportunidade 2>","<ameaça 1>","<ameaça 2>"],
  "marketing": {
    "core": "<mensagem central de marketing>",
    "focus": ["<canal 1>","<canal 2>"],
    "steps": ["<passo 1>","<passo 2>","<passo 3>"]
  }
}
Responda APENAS com o JSON, sem texto adicional.`

function makeLocalDiag(f: AppFormData): DiagResult {
  const sc = f.segment && f.marketTime && f.salesModel ? 42 : 28
  return {
    sc,
    overview: `${f.companyName || 'Sua empresa'} atua no segmento de ${f.segment || 'serviços'} e está em fase de estruturação. O diagnóstico offline identificou oportunidades claras de crescimento.`,
    summary: `Negócio com potencial, precisando estruturar processos e escalar vendas.`,
    gaps: ['Processos de vendas não estruturados', 'Presença digital inconsistente', 'Métricas e indicadores não definidos'],
    direction: 'Focar em estruturar o funil de vendas e consolidar a presença digital antes de escalar.',
    attention: 'Defina metas mensuráveis para os próximos 30 dias antes de qualquer outra ação.',
    priorities: ['Criar processo de follow-up de leads', 'Publicar 3x por semana nas redes sociais', 'Mapear os 5 melhores clientes e entender o que os fidelizou'],
    nextMove: `Esta semana: liste os 10 potenciais clientes mais quentes e envie uma mensagem personalizada para cada um.`,
    swot: [
      `Conhecimento do segmento de ${f.segment || 'mercado'}`,
      f.mainDiff || 'Atendimento diferenciado',
      f.mainDifficulty || 'Processos ainda informais',
      'Dependência de poucos canais de captação',
      `Crescimento do mercado de ${f.segment || 'serviços'} digital`,
      'Possibilidade de parcerias estratégicas',
      'Concorrência crescente no segmento',
      'Mudanças nos algoritmos das redes sociais',
    ],
    marketing: {
      core: `Ajudamos ${f.segment || 'negócios'} a crescer com método e consistência.`,
      focus: [f.leadSource || 'Instagram', 'Indicações'],
      steps: ['Definir avatar do cliente ideal', 'Criar calendário de conteúdo mensal', 'Implementar funil de captação no principal canal'],
    },
  }
}

export function FormDiagnostico() {
  const store     = useStore()
  const [step, setStep]     = useState(store.formStep)
  const [form, setForm]     = useState<AppFormData>(store.formData)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const supa      = createClient()
  const companyId = store.companyId

  function patch(field: keyof AppFormData, value: string) {
    const next = { ...form, [field]: value }
    setForm(next)
    store.setFormData({ [field]: value })
  }

  async function advance() {
    if (!companyId) return
    const currentFields = STEPS[step].fields as (keyof AppFormData)[]
    const partial: Partial<AppFormData> = {}
    currentFields.forEach(f => { if (form[f] !== undefined) partial[f] = form[f] })
    saveCompanyFields(supa, companyId, partial).catch(() => {})

    if (step < STEPS.length - 1) {
      const next = step + 1
      setStep(next)
      store.setFormStep(next)
    } else {
      await runDiagnostic()
    }
  }

  async function runDiagnostic() {
    if (!companyId) return
    setLoading(true)
    setError(null)

    try {
      const raw = await callAgent({
        module: 'diagnostico',
        systemPrompt: SYSTEM_PROMPT,
        userMessage: JSON.stringify(form),
        context: { formData: form },
      })

      const result = extractJSON<DiagResult>(raw) ?? makeLocalDiag(form)
      store.setDiag(result)
      if (companyId) {
        saveDiagnostic(supa, companyId, form, result).catch(() => {})
        saveCompanyFields(supa, companyId, form).catch(() => {})
      }
    } catch {
      store.setDiag(makeLocalDiag(form))
    } finally {
      setLoading(false)
    }
  }

  const currentStep = STEPS[step]
  const isLast = step === STEPS.length - 1
  const progress = ((step) / STEPS.length) * 100

  if (loading) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center py-24 gap-6">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 animate-spin" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="4" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--dx)" strokeWidth="4"
              strokeDasharray="176" strokeDashoffset="132" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Analisando seu negócio...</p>
        <p className="text-xs text-center" style={{ color: 'var(--muted)', maxWidth: 280 }}>
          A IA está gerando seu diagnóstico personalizado. Isso leva alguns segundos.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs" style={{ color: 'var(--muted)' }}>
          <span>Etapa {step + 1} de {STEPS.length}</span>
          <span>{currentStep.title}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'var(--dx)' }}
          />
        </div>
      </div>

      {/* Fields */}
      <div className="rounded-2xl p-6 space-y-5"
           style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          {currentStep.title}
        </h2>

        {currentStep.fields.map(field => (
          <div key={field} className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
              {LABELS[field]}
            </label>
            <textarea
              rows={2}
              value={(form[field as keyof AppFormData] as string) ?? ''}
              onChange={e => patch(field as keyof AppFormData, e.target.value)}
              placeholder={PLACEHOLDERS[field]}
              onKeyDown={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') advance()
              }}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none transition-colors"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="text-xs text-center" style={{ color: '#ef4444' }}>{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { const prev = Math.max(0, step - 1); setStep(prev); store.setFormStep(prev) }}
          disabled={step === 0}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            opacity: step === 0 ? 0.3 : 1,
          }}
        >
          Voltar
        </button>

        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          ⌘+Enter para avançar
        </span>

        <button
          onClick={advance}
          className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity"
          style={{ background: 'var(--dx)', color: '#fff' }}
        >
          {isLast ? 'Gerar diagnóstico' : 'Próximo'}
        </button>
      </div>
    </div>
  )
}
