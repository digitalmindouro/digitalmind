import type { AppState } from '../state/store'

type MaturityInput = Pick<
  AppState,
  'diag' | 'salesProfile' | 'transactions' | 'contacts' |
  'products' | 'contentCalendar' | 'salesGoals' | 'mktGoals'
>

export function calcMaturityScore(s: MaturityInput): number {
  let score = 0
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const agendados = Object.entries(s.contentCalendar)
    .filter(([d]) => d.startsWith(thisMonth))
    .reduce((a, [, v]) => a + v.length, 0)

  const publicados = Object.values(s.contentCalendar)
    .flat()
    .filter(e => e.status === 'publicado').length

  const goalsDefinidas = s.salesGoals.length
  const goalsConcluidas = s.salesGoals.filter(g => g.done >= g.target).length

  if (s.diag) score += 20
  if (s.salesProfile) score += 15
  if (s.transactions.length >= 1) score += 10
  if (s.transactions.length >= 5) score += 5
  if (s.contacts.filter(c => c.tipo === 'cliente').length >= 1) score += 5
  if (s.products.length >= 1) score += 5
  if (agendados >= 3) score += 10
  score += Math.min(publicados * 2, 10)
  if (goalsDefinidas >= 1) score += 5
  score += Math.min(goalsConcluidas * 5, 15)

  return Math.min(100, score)
}

export function detectBusinessStage(s: MaturityInput & { salesLeads: AppState['salesLeads'] }): number {
  const rec = s.transactions.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0)
  const dep = s.transactions.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0)
  const leads = s.salesLeads
  const score = calcMaturityScore(s)
  const temProcesso = Boolean(s.salesProfile)
  const temCRM = leads.length > 0
  const temFinanceiro = s.transactions.length >= 3
  const totalConteudos = Object.values(s.contentCalendar).flat().length

  const hasRealData = s.transactions.length >= 1 || leads.length >= 1
  if (!hasRealData) return 1

  if (score < 25 || (!temProcesso && !temFinanceiro)) return 1
  if (!temCRM && !temFinanceiro) return 1
  if (score < 50 || !temCRM || !temFinanceiro) return 2
  if (score < 65 || (temCRM && leads.filter(l => l.stage === 'novo' || l.stage === 'conversa').length > leads.filter(l => l.stage === 'fechado').length * 2)) return 3
  if (score < 80 || totalConteudos < 10) return 4
  return 5
}
