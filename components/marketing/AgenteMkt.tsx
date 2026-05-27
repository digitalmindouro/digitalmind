'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/lib/state/store'
import { callAgent } from '@/lib/gemini/agent'
import { calcCalStats, calcGoalProgress, currentMonthKey, eventsThisWeek } from '@/lib/utils/marketing'

interface Message { role: 'user' | 'assistant'; content: string }

const SYSTEM_PROMPT = `Você é um especialista em marketing digital para pequenas e médias empresas brasileiras.
Ajude com estratégias de conteúdo, calendário editorial, copywriting, engajamento em redes sociais e crescimento de audiência.
Seja criativo e prático. Quando sugerir conteúdos, forneça ideias concretas e acionáveis com exemplos reais.
Responda sempre em português. Use listas para tornar as respostas mais legíveis.`

const QUICK_ACTIONS = [
  'Sugira conteúdos para essa semana',
  'Como aumentar o engajamento?',
  'Crie uma legenda para um post',
  'Estratégia para crescer no Instagram',
]

export function AgenteMkt() {
  const contentCalendar = useStore(s => s.contentCalendar)
  const mktGoals        = useStore(s => s.mktGoals)
  const formData        = useStore(s => s.formData)
  const diag            = useStore(s => s.diag)
  const salesProfile    = useStore(s => s.salesProfile)

  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Olá! Sou seu consultor de marketing. Posso ajudar com ideias de conteúdo, estratégias para redes sociais e muito mais. Como posso ajudar?`,
  }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function buildContext() {
    const mes   = currentMonthKey()
    const stats = calcCalStats(contentCalendar, mes)
    const goals = calcGoalProgress(contentCalendar, mktGoals)
    const weekEvs = eventsThisWeek(contentCalendar)

    return {
      company: { name: formData.companyName, segment: formData.segment, city: formData.city },
      targetAudience: salesProfile?.summary ?? diag?.overview ?? null,
      calendar: {
        thisMonth: { total: stats.total, published: stats.publicado, scheduled: stats.agendado },
        thisWeek:  { total: weekEvs.length, published: weekEvs.filter(e => e.status === 'publicado').length },
        byFormat: stats.byFormat,
        byPlatform: stats.byPlatform,
      },
      goals: {
        week:  { target: goals.weekTarget,  done: goals.weekPublished },
        month: { target: goals.monthTarget, done: goals.monthPublished },
      },
    }
  }

  async function send(text: string) {
    if (!text.trim() || loading) return
    setMessages(m => [...m, { role: 'user', content: text.trim() }])
    setInput('')
    setLoading(true)

    const response = await callAgent({
      module:       'marketing',
      systemPrompt: SYSTEM_PROMPT,
      userMessage:  text.trim(),
      context:      buildContext(),
    })

    setMessages(m => [...m, { role: 'assistant', content: response }])
    setLoading(false)
  }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); send(input) }

  return (
    <div className="flex flex-col h-[600px] max-w-2xl rounded-xl overflow-hidden"
         style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3"
           style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
             style={{ background: 'var(--mk)' }}>
          IA
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Agente de Marketing</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Estrategista de conteúdo digital</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: 'var(--surface-2)' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={{
                background: msg.role === 'user' ? 'var(--mk)' : 'var(--surface)',
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
              <span className="text-xs" style={{ color: 'var(--muted)' }}>Criando estratégia</span>
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: 'var(--muted)', animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      {messages.length < 3 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto"
             style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          {QUICK_ACTIONS.map(a => (
            <button
              key={a}
              onClick={() => send(a)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs whitespace-nowrap"
              style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              {a}
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
          placeholder="Peça sugestões de conteúdo, estratégias..."
          disabled={loading}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: 'var(--mk)' }}
        >
          →
        </button>
      </form>
    </div>
  )
}
