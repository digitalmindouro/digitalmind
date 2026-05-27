'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/lib/state/store'
import { callAgent } from '@/lib/gemini/agent'
import { calcKanbanKPIs } from '@/lib/utils/vendas'
import { fmtBRL } from '@/lib/utils/formatters'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `Você é um consultor de vendas especializado em pequenos negócios brasileiros.
Ajude o empresário a melhorar seu processo comercial, CRM, follow-up e conversão.
Seja direto, prático e use exemplos reais. Responda sempre em português.
Quando der sugestões, use listas numeradas para facilitar a leitura.`

const QUICK_ACTIONS = [
  'Como melhorar minha taxa de conversão?',
  'Me dê um roteiro de follow-up',
  'Como precificar melhor meu produto?',
  'Estratégia para leads parados',
]

export function AgenteVendas() {
  const salesProfile = useStore(s => s.salesProfile)
  const salesLeads   = useStore(s => s.salesLeads)
  const salesGoals   = useStore(s => s.salesGoals)
  const formData     = useStore(s => s.formData)

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Olá! Sou seu consultor de vendas. Posso ajudar com estratégias de CRM, follow-up, fechamento e mais.${
        salesProfile ? ` Já vi seu diagnóstico comercial — ${salesProfile.summary.slice(0, 120)}...` : ''
      } Como posso ajudar hoje?`,
    },
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const kpis = calcKanbanKPIs(salesLeads)

  function buildContext() {
    return {
      company: {
        name: formData.companyName,
        segment: formData.segment,
        salesModel: formData.salesModel,
      },
      salesProfile: salesProfile
        ? { summary: salesProfile.summary, weaknesses: salesProfile.weaknesses }
        : null,
      pipeline: {
        total: kpis.total,
        pipelineValue: kpis.pipelineValue,
        conversionRate: `${kpis.conversionRate.toFixed(0)}%`,
        leadsAlerts: kpis.leadsAlerts,
      },
      goals: salesGoals.map(g => ({
        label: g.label,
        progress: `${Math.round((g.done / g.target) * 100)}%`,
        target: fmtBRL(g.target),
        done: fmtBRL(g.done),
      })),
    }
  }

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    const response = await callAgent({
      module:       'vendas',
      systemPrompt: SYSTEM_PROMPT,
      userMessage:  text.trim(),
      context:      buildContext(),
    })

    setMessages(m => [...m, { role: 'assistant', content: response }])
    setLoading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  return (
    <div className="flex flex-col h-[600px] max-w-2xl rounded-xl overflow-hidden"
         style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3"
           style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
             style={{ background: 'var(--vd)' }}>
          IA
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Agente de Vendas</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Consultor comercial IA</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3"
           style={{ background: 'var(--surface-2)' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={{
                background: msg.role === 'user' ? 'var(--vd)' : 'var(--surface)',
                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
                 style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>Pensando</span>
              <span className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: 'var(--muted)', animationDelay: `${d}ms` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      {messages.length < 3 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto"
             style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          {QUICK_ACTIONS.map(action => (
            <button
              key={action}
              onClick={() => send(action)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs whitespace-nowrap"
              style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-3"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Pergunte sobre vendas, CRM, follow-up..."
          disabled={loading}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: 'var(--vd)' }}
        >
          →
        </button>
      </form>
    </div>
  )
}
