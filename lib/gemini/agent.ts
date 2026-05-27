'use client'

import { createClient } from '@/lib/supabase/client'

const EDGE_FN = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/digitalmind-agent`

export interface AgentParams {
  module: 'vendas' | 'marketing' | 'diagnostico'
  systemPrompt: string
  userMessage: string
  context: Record<string, unknown>
}

export async function callAgent(params: AgentParams): Promise<string> {
  try {
    const supa = createClient()
    const { data: { session } } = await supa.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error('no session')

    const res = await fetch(EDGE_FN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,   // user JWT — not anon key
      },
      body: JSON.stringify({
        module:       params.module,
        systemPrompt: params.systemPrompt,
        message:      params.userMessage,
        context:      params.context,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { response?: string; text?: string; output?: string }
    return json.response ?? json.text ?? json.output ?? 'Sem resposta da IA.'
  } catch {
    return localFallback(params)
  }
}

function localFallback(params: AgentParams): string {
  const fallbacks: Record<AgentParams['module'], string> = {
    vendas: `**Agente offline** — Sem conexão com o servidor. Dica rápida: foque em leads que estão há mais de 7 dias sem contato e faça follow-up hoje. Pequenas ações consistentes geram grandes resultados em vendas.`,
    marketing: `**Agente offline** — Sem conexão com o servidor. Dica: publique pelo menos 3 conteúdos esta semana focados na dor principal do seu cliente.`,
    diagnostico: `**Agente offline** — Sem conexão com o servidor. Complete o diagnóstico e volte quando a conexão estiver disponível.`,
  }
  return fallbacks[params.module]
}

// Parse JSON from Gemini response (handles markdown code blocks)
export function extractJSON<T>(text: string): T | null {
  const codeBlock = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/)
  const raw       = codeBlock ? codeBlock[1] : text.match(/\{[\s\S]*\}/)?.[0]
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}
