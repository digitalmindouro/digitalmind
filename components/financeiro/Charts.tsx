'use client'

import { fmtBRL } from '@/lib/utils/formatters'
import type { MonthlyPoint, CategoryPoint, ProjectionPoint } from '@/lib/utils/financeiro'

// ─── Helpers SVG ─────────────────────────────────────────────────────────────

function polarToXY(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  }
}

function donutSlicePath(cx: number, cy: number, outerR: number, innerR: number, start: number, end: number): string {
  const os = polarToXY(cx, cy, outerR, start)
  const oe = polarToXY(cx, cy, outerR, end)
  const ie = polarToXY(cx, cy, innerR, end)
  const is_ = polarToXY(cx, cy, innerR, start)
  const large = end - start > Math.PI ? 1 : 0
  return [
    `M ${os.x.toFixed(2)} ${os.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oe.x.toFixed(2)} ${oe.y.toFixed(2)}`,
    `L ${ie.x.toFixed(2)} ${ie.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${is_.x.toFixed(2)} ${is_.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

// ─── Cores ────────────────────────────────────────────────────────────────────

const RECEITA_COLOR = '#10b981'
const DESPESA_COLOR = '#ef4444'
const PALETTE = ['#6366f1','#f59e0b','#8b5cf6','#3b82f6','#ec4899','#06b6d4','#84cc16','#f97316']

// ─── Bar Chart — Evolução Mensal ─────────────────────────────────────────────

interface BarChartProps { data: MonthlyPoint[] }

export function EvolucaoChart({ data }: BarChartProps) {
  if (!data.length) return null

  const W = 500, H = 220, PL = 52, PR = 12, PT = 12, PB = 28
  const chartW = W - PL - PR
  const chartH = H - PT - PB

  const maxVal = Math.max(...data.flatMap(d => [d.receita, d.despesa]), 1)
  const slotW  = chartW / data.length
  const barW   = slotW * 0.3

  function yOf(v: number) { return PT + chartH - (v / maxVal) * chartH }

  // Y axis ticks (4 labels)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: maxVal * f, y: yOf(maxVal * f) }))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      {/* grid lines */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PL} y1={t.y} x2={W - PR} y2={t.y}
                stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
          <text x={PL - 4} y={t.y + 4} textAnchor="end" fontSize={9} fill="var(--muted)">
            {t.v >= 1000 ? `${(t.v / 1000).toFixed(0)}k` : t.v.toFixed(0)}
          </text>
        </g>
      ))}

      {/* bars */}
      {data.map((d, i) => {
        const centerX = PL + i * slotW + slotW / 2
        const rx = centerX - barW - 1
        const dx = centerX + 1
        const rh = ((d.receita) / maxVal) * chartH
        const dh = ((d.despesa) / maxVal) * chartH

        return (
          <g key={d.key}>
            {/* receita bar */}
            {d.receita > 0 && (
              <rect x={rx} y={PT + chartH - rh} width={barW} height={rh}
                    fill={RECEITA_COLOR} rx={2} opacity={0.85} />
            )}
            {/* despesa bar */}
            {d.despesa > 0 && (
              <rect x={dx} y={PT + chartH - dh} width={barW} height={dh}
                    fill={DESPESA_COLOR} rx={2} opacity={0.85} />
            )}
            {/* x label */}
            <text x={centerX} y={H - 4} textAnchor="middle" fontSize={10} fill="var(--muted)">
              {d.label}
            </text>
          </g>
        )
      })}

      {/* legend */}
      <g transform={`translate(${PL}, ${PT - 2})`}>
        <rect width={8} height={8} rx={2} fill={RECEITA_COLOR} />
        <text x={11} y={7} fontSize={9} fill="var(--muted)">Receita</text>
        <rect x={62} width={8} height={8} rx={2} fill={DESPESA_COLOR} />
        <text x={73} y={7} fontSize={9} fill="var(--muted)">Despesa</text>
      </g>
    </svg>
  )
}

// ─── Donut Chart — Composição de Despesas ────────────────────────────────────

interface DonutChartProps { data: CategoryPoint[]; total: number }

export function DespesasChart({ data, total }: DonutChartProps) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-40">
      <p className="text-sm" style={{ color: 'var(--muted)' }}>Sem despesas no período.</p>
    </div>
  )

  const cx = 100, cy = 100, outerR = 80, innerR = 52
  let angle = 0

  const slices = data.slice(0, 8).map((cat, i) => {
    const start = angle
    const sweep = (cat.value / total) * (2 * Math.PI)
    angle += sweep
    const end = angle
    return { ...cat, start, end, color: PALETTE[i % PALETTE.length] }
  })

  return (
    <div className="flex flex-col gap-4">
      <svg viewBox="0 0 200 200" className="w-40 mx-auto">
        {slices.map((s, i) => (
          <path key={i} d={donutSlicePath(cx, cy, outerR, innerR, s.start, s.end)}
                fill={s.color} opacity={0.9} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={8} fill="var(--muted)">Total</text>
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize={10} fontWeight="600" fill="var(--text)">
          {fmtBRL(total).replace('R$ ', 'R$')}
        </text>
      </svg>

      {/* legend */}
      <div className="space-y-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
              <span className="truncate max-w-[120px]" style={{ color: 'var(--muted)' }}>{s.name}</span>
            </div>
            <span className="font-medium tabular-nums" style={{ color: 'var(--text)' }}>
              {s.percent.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Line Chart — Projeção ───────────────────────────────────────────────────

interface ProjecaoChartProps { data: ProjectionPoint[] }

export function ProjecaoChart({ data }: ProjecaoChartProps) {
  if (!data.length) return null

  const W = 500, H = 200, PL = 52, PR = 20, PT = 12, PB = 28
  const chartW = W - PL - PR
  const chartH = H - PT - PB
  const N = data.length

  const allVals = data.flatMap(d => [d.receita ?? 0, d.despesa ?? 0, d.receitaProj ?? 0, d.despesaProj ?? 0])
  const maxVal  = Math.max(...allVals, 1)

  function xOf(i: number)  { return PL + (i / (N - 1)) * chartW }
  function yOf(v: number)  { return PT + chartH - (v / maxVal) * chartH }

  // Build SVG path strings for each series
  function pointsFor(getValue: (d: ProjectionPoint) => number | null, projOnly: boolean): [number, number][] {
    return data
      .map((d, i) => {
        const v = getValue(d)
        if (v === null) return null
        if (projOnly && !d.isProjected) return null
        if (!projOnly && d.isProjected) return null
        return [xOf(i), yOf(v)] as [number, number]
      })
      .filter(Boolean) as [number, number][]
  }

  function polyline(pts: [number, number][]) {
    return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  }

  const recHistPts  = pointsFor(d => d.receita, false)
  const depHistPts  = pointsFor(d => d.despesa, false)
  const recProjPts  = pointsFor(d => d.receitaProj, true)
  const depProjPts  = pointsFor(d => d.despesaProj, true)

  // Connect history end → projection start
  const recConnect = [
    ...(recHistPts.at(-1) ? [recHistPts.at(-1)!] : []),
    ...(recProjPts.at(0)  ? [recProjPts.at(0)!]  : []),
  ]
  const depConnect = [
    ...(depHistPts.at(-1) ? [depHistPts.at(-1)!] : []),
    ...(depProjPts.at(0)  ? [depProjPts.at(0)!]  : []),
  ]

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: maxVal * f, y: yOf(maxVal * f) }))
  const projStartX = data.findIndex(d => d.isProjected)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      <defs>
        <pattern id="projPattern" patternUnits="userSpaceOnUse" width={6} height={6} patternTransform="rotate(45)">
          <rect width={6} height={6} fill="var(--surface-2)" opacity={0.5} />
        </pattern>
      </defs>

      {/* projected area background */}
      {projStartX >= 0 && (
        <rect
          x={xOf(projStartX) - slotW(N, chartW) / 2}
          y={PT}
          width={chartW - (xOf(projStartX) - PL) + slotW(N, chartW) / 2}
          height={chartH}
          fill="var(--surface-2)" opacity={0.4}
        />
      )}

      {/* grid */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PL} y1={t.y} x2={W - PR} y2={t.y}
                stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
          <text x={PL - 4} y={t.y + 4} textAnchor="end" fontSize={9} fill="var(--muted)">
            {t.v >= 1000 ? `${(t.v / 1000).toFixed(0)}k` : t.v.toFixed(0)}
          </text>
        </g>
      ))}

      {/* history lines */}
      {recHistPts.length > 1 && (
        <polyline points={polyline(recHistPts)} fill="none" stroke={RECEITA_COLOR} strokeWidth={2} />
      )}
      {depHistPts.length > 1 && (
        <polyline points={polyline(depHistPts)} fill="none" stroke={DESPESA_COLOR} strokeWidth={2} />
      )}

      {/* connector (solid → dashed) */}
      {recConnect.length === 2 && (
        <polyline points={polyline(recConnect)} fill="none" stroke={RECEITA_COLOR} strokeWidth={1.5} strokeDasharray="4 2" />
      )}
      {depConnect.length === 2 && (
        <polyline points={polyline(depConnect)} fill="none" stroke={DESPESA_COLOR} strokeWidth={1.5} strokeDasharray="4 2" />
      )}

      {/* projection lines */}
      {recProjPts.length > 1 && (
        <polyline points={polyline(recProjPts)} fill="none" stroke={RECEITA_COLOR} strokeWidth={1.5} strokeDasharray="4 2" />
      )}
      {depProjPts.length > 1 && (
        <polyline points={polyline(depProjPts)} fill="none" stroke={DESPESA_COLOR} strokeWidth={1.5} strokeDasharray="4 2" />
      )}

      {/* dots */}
      {[...recHistPts, ...recProjPts].map(([x, y], i) => (
        <circle key={`r${i}`} cx={x} cy={y} r={3} fill={RECEITA_COLOR} />
      ))}
      {[...depHistPts, ...depProjPts].map(([x, y], i) => (
        <circle key={`d${i}`} cx={x} cy={y} r={3} fill={DESPESA_COLOR} />
      ))}

      {/* x labels */}
      {data.map((d, i) => (
        <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize={10} fill="var(--muted)">
          {d.label}{d.isProjected ? '*' : ''}
        </text>
      ))}

      {/* legend */}
      <g transform={`translate(${PL}, ${PT - 2})`}>
        <rect width={8} height={8} rx={2} fill={RECEITA_COLOR} />
        <text x={11} y={7} fontSize={9} fill="var(--muted)">Receita</text>
        <rect x={62} width={8} height={8} rx={2} fill={DESPESA_COLOR} />
        <text x={73} y={7} fontSize={9} fill="var(--muted)">Despesa</text>
        <text x={130} y={7} fontSize={9} fill="var(--muted)">* projetado</text>
      </g>
    </svg>
  )
}

function slotW(n: number, chartW: number) { return n > 1 ? chartW / (n - 1) : chartW }
