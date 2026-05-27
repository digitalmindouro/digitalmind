// ── Diagnóstico
export interface DiagResult {
  sc: number
  overview: string
  summary: string
  gaps: string[]
  direction: string
  attention: string
  priorities: string[]
  nextMove: string
  swot: string[]
  marketing: {
    core: string
    focus: string[]
    steps: string[]
  }
  matrix?: Record<string, unknown>
}

export interface FormData {
  companyName: string
  city: string
  segment: string
  marketTime: string
  salesModel: string
  mainGoal: string
  mainDifficulty: string
  digitalPresence?: string
  desiredAdvance?: string
  mainDiff?: string
  leadSource?: string
}

// ── Financeiro
export interface Transaction {
  id: string
  tipo: 'receita' | 'despesa'
  desc: string
  valor: number
  cat: string
  data: string
  dataISO: string
  clienteId: string | null
  fornecedorId: string | null
  produtoId: string | null
}

export interface Contact {
  id: string
  nome: string
  contato: string
  tipo: 'cliente' | 'fornecedor'
}

export interface Product {
  id: string
  nome: string
  preco: number
  cat: string
}

// ── Vendas
export interface SalesProfile {
  summary: string
  weaknesses: string[]
  actions: string[]
  answers?: string[]
}

// ── CRM
export interface CrmLead {
  id: string
  name: string
  product: string
  value: string
  stage: 'novo' | 'conversa' | 'proposta' | 'fechado' | 'perdido'
  lastContact: string
  nextContact: string
  nextStep: string
  createdAt?: string
}

// ── Marketing
export interface CalendarEvent {
  id: string
  titulo: string
  descricao: string
  hora: string
  formato: 'post' | 'reel' | 'story' | 'carrossel'
  type: string
  plataforma: string
  status: 'agendado' | 'publicado'
  note: string
}

export type ContentCalendar = Record<string, CalendarEvent[]>

export interface MktGoals {
  week?: { target: number; label: string; done: number }
  month?: { target: number; label: string; done: number }
}

// ── Metas comerciais
export interface SalesGoal {
  id: string
  label: string
  target: number
  done: number
}

// ── Evolução
export interface EvoEntry {
  month: number
  year: number
  score: number
  label: string
}

// ── Categorias financeiras
export interface Categories {
  receita: string[]
  despesa: string[]
}
