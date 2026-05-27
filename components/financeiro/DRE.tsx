'use client'

import { useState } from 'react'
import { fmtBRL } from '@/lib/utils/formatters'
import { calcDRE, calcMonthlyEvolution } from '@/lib/utils/financeiro'
import type { Transaction } from '@/types/app'

interface Props { transactions: Transaction[] }

export function DRE({ transactions }: Props) {
  const months = calcMonthlyEvolution(transactions, 6)
  const [selectedKey, setSelectedKey] = useState<string>('')  // '' = total period

  const lines = calcDRE(transactions, selectedKey || undefined)
  const resultadoLine = lines.find(l => l.isTotal && l.label === 'RESULTADO')
  const margemLine    = lines.find(l => l.isTotal && l.label === 'Margem líquida')

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedKey('')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: selectedKey === '' ? 'var(--accent)' : 'var(--surface-2)',
            color: selectedKey === '' ? '#fff' : 'var(--muted)',
            border: '1px solid var(--border)',
          }}
        >
          Período total
        </button>
        {months.map(m => (
          <button
            key={m.key}
            onClick={() => setSelectedKey(m.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: selectedKey === m.key ? 'var(--accent)' : 'var(--surface-2)',
              color: selectedKey === m.key ? '#fff' : 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* DRE table */}
      <div className="rounded-xl overflow-hidden"
           style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: 'var(--muted)' }}>Descrição</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium" style={{ color: 'var(--muted)' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const isMargemLine = line.isTotal && line.label === 'Margem líquida'
              const isResultado  = line.isTotal && line.label === 'RESULTADO'
              const color = isResultado
                ? line.value >= 0 ? '#10b981' : '#ef4444'
                : line.isHeader ? 'var(--text)' : 'var(--muted)'

              return (
                <tr
                  key={i}
                  style={{
                    background: line.isHeader ? 'var(--surface)' : line.isTotal ? 'var(--surface-2)' : 'transparent',
                    borderTop: line.isHeader || line.isTotal ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <td className="px-4 py-2.5" style={{ color, paddingLeft: line.indent ? '2rem' : undefined }}>
                    {line.isHeader ? line.label : line.indent ? line.label : <strong>{line.label}</strong>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs" style={{ color }}>
                    {isMargemLine
                      ? `${line.value.toFixed(1)}%`
                      : fmtBRL(line.isHeader && line.label === 'DESPESAS' ? -line.value : line.value)
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {lines.length <= 2 && (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>
            Nenhuma transação neste período.
          </p>
        )}
      </div>

      {/* Summary */}
      {resultadoLine && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Resultado</p>
            <p className="text-lg font-bold" style={{ color: resultadoLine.value >= 0 ? '#10b981' : '#ef4444' }}>
              {fmtBRL(resultadoLine.value)}
            </p>
          </div>
          {margemLine && (
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Margem líquida</p>
              <p className="text-lg font-bold" style={{ color: margemLine.value >= 0 ? '#10b981' : '#ef4444' }}>
                {margemLine.value.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
