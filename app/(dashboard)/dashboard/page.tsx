'use client'

import Link from 'next/link'
import { useStore } from '@/lib/state/store'
import { calcMaturityScore, detectBusinessStage } from '@/lib/utils/maturity'

const MODULES = [
  { href: '/diagnostico', label: 'Diagnóstico', abbr: 'DX', color: 'var(--dx)', desc: 'Análise do seu negócio' },
  { href: '/marketing',   label: 'Marketing',   abbr: 'MK', color: 'var(--mk)', desc: 'Calendário e agente IA' },
  { href: '/vendas',      label: 'Vendas',       abbr: 'VD', color: 'var(--vd)', desc: 'CRM e metas' },
  { href: '/financeiro',  label: 'Financeiro',   abbr: 'FN', color: 'var(--fn)', desc: 'Fluxo de caixa' },
  { href: '/evolucao',    label: 'Evolução',     abbr: 'EV', color: 'var(--ev)', desc: 'Maturidade do negócio' },
]

export default function DashboardPage() {
  const s = useStore()
  const score = calcMaturityScore(s)
  const stage = detectBusinessStage({ ...s, salesLeads: s.salesLeads })
  const companyName = s.formData.companyName

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* greeting */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {companyName ? `Olá, ${companyName}` : 'Bem-vindo ao DigitalMind'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Estágio {stage} · Maturidade {score}%
        </p>
      </div>

      {/* maturity bar */}
      <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--muted)' }}>
          <span>Maturidade do negócio</span>
          <span className="font-semibold" style={{ color: 'var(--text)' }}>{score}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${score}%`, background: 'var(--accent)' }}
          />
        </div>
      </div>

      {/* module grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MODULES.map(mod => (
          <Link
            key={mod.href}
            href={mod.href}
            className="rounded-xl p-4 flex flex-col gap-3 transition-colors hover:border-white/10"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: mod.color }}>
              {mod.abbr}
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{mod.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{mod.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
