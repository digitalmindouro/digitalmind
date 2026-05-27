'use client'

import { useStore } from '@/lib/state/store'
import type { DiagResult } from '@/types/app'

function ScoreRing({ sc }: { sc: number }) {
  const r = 54
  const cx = 70
  const cy = 70
  const sw = 10
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - sc / 100)
  const color = sc >= 70 ? '#10b981' : sc >= 45 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={28} fontWeight="700" fill={color}>
          {sc}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="var(--muted)">
          /100
        </text>
      </svg>
      <p className="text-xs font-medium" style={{ color }}>
        {sc >= 70 ? 'Negócio estruturado' : sc >= 45 ? 'Em desenvolvimento' : 'Precisa de estrutura'}
      </p>
    </div>
  )
}

function SwotGrid({ swot }: { swot: string[] }) {
  const quadrants = [
    { label: 'Forças',        items: [swot[0], swot[1]], color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
    { label: 'Fraquezas',     items: [swot[2], swot[3]], color: '#ef4444', bg: 'rgba(239,68,68,0.06)'  },
    { label: 'Oportunidades', items: [swot[4], swot[5]], color: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
    { label: 'Ameaças',       items: [swot[6], swot[7]], color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {quadrants.map(({ label, items, color, bg }) => (
        <div key={label} className="rounded-xl p-4 space-y-2" style={{ background: bg, border: `1px solid ${color}33` }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>{label}</p>
          {items.filter(Boolean).map((item, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>• {item}</p>
          ))}
        </div>
      ))}
    </div>
  )
}

interface Props {
  result: DiagResult
}

export function ResultadoDiag({ result }: Props) {
  const store = useStore()

  function handleRefazer() {
    store.setDiag(null as unknown as DiagResult)
    store.setFormStep(0)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Diagnóstico</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {store.formData.companyName || 'Sua empresa'}
          </p>
        </div>
        <button
          onClick={handleRefazer}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          Refazer diagnóstico
        </button>
      </div>

      {/* Score + overview */}
      <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6"
           style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <ScoreRing sc={result.sc} />
        <div className="flex-1 space-y-3">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{result.overview}</p>
          {result.attention && (
            <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-xs font-medium" style={{ color: '#f59e0b' }}>⚠ Atenção</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>{result.attention}</p>
            </div>
          )}
        </div>
      </div>

      {/* SWOT */}
      {result.swot?.length >= 4 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Análise SWOT</h3>
          <SwotGrid swot={result.swot} />
        </div>
      )}

      {/* Prioridades */}
      {result.priorities?.length > 0 && (
        <div className="rounded-2xl p-5 space-y-3"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Prioridades</h3>
          {result.priorities.map((p, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                    style={{ background: 'var(--dx)', color: '#fff' }}>
                {i + 1}
              </span>
              <p className="text-sm" style={{ color: 'var(--text)' }}>{p}</p>
            </div>
          ))}
        </div>
      )}

      {/* Próximo passo */}
      {result.nextMove && (
        <div className="rounded-2xl p-5 space-y-2"
             style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--dx)' }}>Próxima ação</p>
          <p className="text-sm" style={{ color: 'var(--text)' }}>{result.nextMove}</p>
        </div>
      )}

      {/* Gaps */}
      {result.gaps?.length > 0 && (
        <div className="rounded-2xl p-5 space-y-3"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Lacunas identificadas</h3>
          {result.gaps.map((g, i) => (
            <p key={i} className="text-sm" style={{ color: 'var(--muted)' }}>• {g}</p>
          ))}
        </div>
      )}

      {/* Marketing */}
      {result.marketing?.core && (
        <div className="rounded-2xl p-5 space-y-3"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Direcionamento de marketing</h3>
          <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--mk)' }}>Mensagem central</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text)' }}>{result.marketing.core}</p>
          </div>
          {result.marketing.focus?.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Canais foco</p>
              <div className="flex flex-wrap gap-2">
                {result.marketing.focus.map((ch, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.marketing.steps?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Próximos passos</p>
              {result.marketing.steps.map((s, i) => (
                <p key={i} className="text-sm" style={{ color: 'var(--text)' }}>
                  <span style={{ color: 'var(--mk)' }}>{i + 1}. </span>{s}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Direction */}
      {result.direction && (
        <div className="rounded-2xl p-5 space-y-1"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Direção estratégica</p>
          <p className="text-sm" style={{ color: 'var(--text)' }}>{result.direction}</p>
        </div>
      )}

      {/* Refazer CTA */}
      <div className="flex justify-center pb-6">
        <button
          onClick={handleRefazer}
          className="px-6 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          Refazer diagnóstico
        </button>
      </div>
    </div>
  )
}
