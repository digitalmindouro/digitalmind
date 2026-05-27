'use client'

import { useState } from 'react'
import { useStore, type AppState } from '@/lib/state/store'
import { createClient } from '@/lib/supabase/client'
import { calcMaturityScore, detectBusinessStage } from '@/lib/utils/maturity'
import { saveEvoEntry } from '@/lib/supabase/queries/evolucao'
import type { EvoEntry } from '@/types/app'

// ── Stage definitions
const STAGES = [
  {
    n: 1,
    label: 'Sobrevivência',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    desc: 'O negócio ainda está se estabelecendo. Foco em gerar as primeiras receitas consistentes e entender o cliente.',
    tips: [
      'Defina seu cliente ideal com clareza',
      'Foque em 1-2 produtos ou serviços principais',
      'Estabeleça um processo mínimo de vendas',
      'Registre todas as receitas e despesas',
    ],
  },
  {
    n: 2,
    label: 'Estruturação',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    desc: 'A empresa começa a ganhar forma. Processos são criados, clientes se repetem e a operação começa a funcionar com mais previsibilidade.',
    tips: [
      'Documente seus processos principais',
      'Crie um CRM simples para acompanhar leads',
      'Estabeleça uma rotina de marketing',
      'Defina metas mensais mensuráveis',
    ],
  },
  {
    n: 3,
    label: 'Tração',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.25)',
    desc: 'O negócio está crescendo de forma consistente. Vendas acontecem com mais regularidade e a marca começa a ser reconhecida.',
    tips: [
      'Invista em conteúdo e presença digital',
      'Automatize processos repetitivos',
      'Acompanhe métricas de conversão',
      'Comece a delegar tarefas operacionais',
    ],
  },
  {
    n: 4,
    label: 'Escala',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.25)',
    desc: 'O modelo de negócio está validado e a empresa cresce com eficiência. Hora de ampliar canais, time e estrutura.',
    tips: [
      'Estruture um time comercial',
      'Diversifique canais de aquisição',
      'Implemente KPIs por área',
      'Explore novos mercados ou segmentos',
    ],
  },
  {
    n: 5,
    label: 'Referência',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
    desc: 'O negócio é referência no segmento. A marca é reconhecida, o time é sólido e o crescimento é sustentável.',
    tips: [
      'Desenvolva lideranças internas',
      'Crie programas de fidelização',
      'Explore parcerias e co-criação',
      'Invista em inovação contínua',
    ],
  },
]

// ── Score ring
function MaturityRing({ score }: { score: number }) {
  const r = 54, cx = 70, cy = 70, sw = 10
  const circ  = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color  = score >= 70 ? '#10b981' : score >= 45 ? '#3b82f6' : score >= 25 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={28} fontWeight="700" fill={color}>
          {score}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="var(--muted)">
          /100
        </text>
      </svg>
      <p className="text-xs font-medium" style={{ color }}>Maturidade</p>
    </div>
  )
}

// ── History SVG line chart
function EvoHistoryChart({ history }: { history: EvoEntry[] }) {
  if (history.length < 2) return null

  const sorted = [...history].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
  const W = 400, H = 100, PAD = { t: 8, r: 8, b: 24, l: 32 }
  const chartW = W - PAD.l - PAD.r
  const chartH = H - PAD.t - PAD.b
  const maxY = 100

  const pts = sorted.map((e, i) => ({
    x: PAD.l + (i / (sorted.length - 1)) * chartW,
    y: PAD.t + chartH - (e.score / maxY) * chartH,
    entry: e,
  }))

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = [
    `M ${pts[0].x} ${PAD.t + chartH}`,
    ...pts.map(p => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length - 1].x} ${PAD.t + chartH}`,
    'Z',
  ].join(' ')

  const monthLabels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      <defs>
        <linearGradient id="evoGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(v => {
        const y = PAD.t + chartH - (v / maxY) * chartH
        return (
          <g key={v}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="var(--border)" strokeWidth={0.5} />
            <text x={PAD.l - 4} y={y + 3} textAnchor="end" fontSize={7} fill="var(--muted)">{v}</text>
          </g>
        )
      })}
      <path d={area} fill="url(#evoGrad)" />
      <polyline points={polyline} fill="none" stroke="#ec4899" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#ec4899" />
          {i === pts.length - 1 && (
            <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize={7} fill="#ec4899" fontWeight="600">
              {p.entry.score}
            </text>
          )}
        </g>
      ))}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize={7} fill="var(--muted)">
          {monthLabels[p.entry.month - 1]}
        </text>
      ))}
    </svg>
  )
}

// ── Score breakdown
function ScoreBreakdown({ store }: { store: AppState }) {
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const agendados = Object.entries(store.contentCalendar)
    .filter(([d]) => d.startsWith(thisMonth))
    .reduce((a, [, v]) => a + v.length, 0)
  const publicados = Object.values(store.contentCalendar).flat().filter(e => e.status === 'publicado').length
  const goalsDone  = store.salesGoals.filter(g => g.done >= g.target).length

  const items = [
    { label: 'Diagnóstico realizado',          pts: 20, done: !!store.diag },
    { label: 'Diagnóstico de vendas feito',     pts: 15, done: !!store.salesProfile },
    { label: 'Primeiro lançamento financeiro',  pts: 10, done: store.transactions.length >= 1 },
    { label: '5+ transações registradas',       pts: 5,  done: store.transactions.length >= 5 },
    { label: 'Cliente cadastrado',              pts: 5,  done: store.contacts.some(c => c.tipo === 'cliente') },
    { label: 'Produto cadastrado',              pts: 5,  done: store.products.length >= 1 },
    { label: '3+ conteúdos agendados este mês', pts: 10, done: agendados >= 3 },
    { label: `Conteúdos publicados (${Math.min(publicados, 5)}×2)`, pts: Math.min(publicados * 2, 10), done: publicados > 0, partial: true },
    { label: 'Meta comercial definida',         pts: 5,  done: store.salesGoals.length >= 1 },
    { label: `Metas concluídas (${goalsDone}×5)`, pts: Math.min(goalsDone * 5, 15), done: goalsDone > 0, partial: true },
  ]

  return (
    <div className="space-y-2">
      {items.map(({ label, pts, done, partial }) => (
        <div key={label} className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: done ? (partial ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.15)') : 'var(--surface-2)',
                    border: `1px solid ${done ? (partial ? '#8b5cf6' : '#10b981') : 'var(--border)'}`,
                  }}>
              {done && <span style={{ color: partial ? '#8b5cf6' : '#10b981', fontSize: 8 }}>✓</span>}
            </span>
            <span style={{ color: done ? 'var(--text)' : 'var(--muted)' }}>{label}</span>
          </div>
          <span className="font-medium tabular-nums" style={{ color: done ? '#10b981' : 'var(--muted)' }}>
            +{pts}
          </span>
        </div>
      ))}
    </div>
  )
}

export function EvolucaoModule() {
  const store = useStore()
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [selectedStage, setSelectedStage] = useState<number | null>(null)

  const score      = calcMaturityScore(store)
  const stageNum   = detectBusinessStage(store)
  const showStage  = selectedStage ?? stageNum
  const stageData  = STAGES[showStage - 1]

  async function handleSave() {
    if (!store.companyId) return
    setSaving(true)
    const now = new Date()
    const entry: EvoEntry = {
      month: now.getMonth() + 1,
      year:  now.getFullYear(),
      score,
      label: stageData.label,
    }
    const supa = createClient()
    await saveEvoEntry(supa, store.companyId, entry).catch(() => {})
    store.setEvoHistory([
      ...store.evoHistory.filter(e => !(e.month === entry.month && e.year === entry.year)),
      entry,
    ])
    store.setMaturityScore(score)
    store.setBusinessStage(stageNum)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Evolução</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Estágio atual: <span style={{ color: stageData.color }}>{stageData.label}</span>
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity"
          style={{
            background: saved ? 'rgba(16,185,129,0.15)' : 'var(--ev)',
            border: `1px solid ${saved ? '#10b981' : 'transparent'}`,
            color: saved ? '#10b981' : '#fff',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar progresso'}
        </button>
      </div>

      {/* Score ring + breakdown */}
      <div className="rounded-2xl p-6 flex flex-col sm:flex-row gap-6"
           style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col items-center gap-3 shrink-0">
          <MaturityRing score={score} />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Como é calculado</p>
          <ScoreBreakdown store={store} />
        </div>
      </div>

      {/* Stage cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Estágios de maturidade</h3>
        <div className="grid grid-cols-5 gap-2">
          {STAGES.map(s => (
            <button
              key={s.n}
              onClick={() => setSelectedStage(selectedStage === s.n ? null : s.n)}
              className="rounded-xl p-3 flex flex-col items-center gap-1 transition-all"
              style={{
                background: showStage === s.n ? s.bg : 'var(--surface)',
                border: `1px solid ${showStage === s.n ? s.border : 'var(--border)'}`,
                outline: stageNum === s.n ? `2px solid ${s.color}` : 'none',
                outlineOffset: 2,
              }}
            >
              <span className="text-lg font-bold" style={{ color: s.color }}>{s.n}</span>
              <span className="text-[9px] font-medium text-center leading-tight" style={{ color: s.color }}>
                {s.label}
              </span>
              {stageNum === s.n && (
                <span className="text-[8px]" style={{ color: s.color }}>← atual</span>
              )}
            </button>
          ))}
        </div>

        {/* Stage detail */}
        <div className="rounded-2xl p-5 space-y-4"
             style={{ background: stageData.bg, border: `1px solid ${stageData.border}` }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: stageData.color }}>
              {stageData.n}. {stageData.label}
              {stageNum === stageData.n && (
                <span className="ml-2 text-xs font-normal" style={{ color: 'var(--muted)' }}>
                  (seu estágio atual)
                </span>
              )}
            </p>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text)' }}>
              {stageData.desc}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Foco neste estágio</p>
            {stageData.tips.map((tip, i) => (
              <p key={i} className="text-xs" style={{ color: 'var(--text)' }}>• {tip}</p>
            ))}
          </div>
        </div>
      </div>

      {/* History chart */}
      {store.evoHistory.length >= 2 && (
        <div className="rounded-2xl p-5 space-y-3"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Histórico de maturidade</p>
          <EvoHistoryChart history={store.evoHistory} />
        </div>
      )}

      {store.evoHistory.length === 1 && (
        <div className="rounded-2xl p-4 text-center" style={{ border: '1px dashed var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Salve seu progresso mês a mês para ver o histórico de evolução.
          </p>
        </div>
      )}
    </div>
  )
}
