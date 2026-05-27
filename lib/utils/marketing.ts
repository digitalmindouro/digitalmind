import type { ContentCalendar, CalendarEvent, MktGoals } from '@/types/app'

export const FORMAT_CONFIG: Record<CalendarEvent['formato'], { label: string; color: string }> = {
  post:      { label: 'Post',      color: '#6366f1' },
  reel:      { label: 'Reel',      color: '#ec4899' },
  story:     { label: 'Story',     color: '#f59e0b' },
  carrossel: { label: 'Carrossel', color: '#10b981' },
}

export const FORMATS: CalendarEvent['formato'][] = ['post', 'reel', 'story', 'carrossel']
export const PLATFORMS = ['instagram', 'tiktok', 'facebook', 'whatsapp', 'youtube', 'linkedin']
export const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

// Week starts on Monday (Brazilian standard)
export function buildCalendarGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7   // 0=Mon, 6=Sun

  const weeks: (Date | null)[][] = []
  let week: (Date | null)[] = Array(startDow).fill(null)

  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(new Date(year, month, d))
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function allEvents(cal: ContentCalendar): CalendarEvent[] {
  return Object.values(cal).flat()
}

export function eventsInMonth(cal: ContentCalendar, monthKey: string): CalendarEvent[] {
  return Object.entries(cal)
    .filter(([k]) => k.startsWith(monthKey))
    .flatMap(([, evs]) => evs)
}

function currentWeekRange(): { start: string; end: string } {
  const now  = new Date()
  const mon  = new Date(now)
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const sun  = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt  = (d: Date) => d.toISOString().split('T')[0]
  return { start: fmt(mon), end: fmt(sun) }
}

export function eventsThisWeek(cal: ContentCalendar): CalendarEvent[] {
  const { start, end } = currentWeekRange()
  return Object.entries(cal)
    .filter(([k]) => k >= start && k <= end)
    .flatMap(([, evs]) => evs)
}

export function currentMonthKey(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

export interface CalStats {
  total: number
  publicado: number
  agendado: number
  byFormat: Record<string, number>
  byPlatform: Record<string, number>
}

export function calcCalStats(cal: ContentCalendar, monthKey?: string): CalStats {
  const evs = monthKey ? eventsInMonth(cal, monthKey) : allEvents(cal)
  const byFormat: Record<string, number>   = {}
  const byPlatform: Record<string, number> = {}

  for (const e of evs) {
    byFormat[e.formato]     = (byFormat[e.formato] ?? 0) + 1
    const p = e.plataforma || 'outros'
    byPlatform[p]           = (byPlatform[p] ?? 0) + 1
  }

  return {
    total:     evs.length,
    publicado: evs.filter(e => e.status === 'publicado').length,
    agendado:  evs.filter(e => e.status === 'agendado').length,
    byFormat,
    byPlatform,
  }
}

export interface GoalProgress {
  weekPublished: number
  weekTarget: number
  monthPublished: number
  monthTarget: number
}

export function calcGoalProgress(cal: ContentCalendar, goals: MktGoals): GoalProgress {
  const mes = currentMonthKey()
  return {
    weekPublished:  eventsThisWeek(cal).filter(e => e.status === 'publicado').length,
    weekTarget:     goals.week?.target ?? 0,
    monthPublished: eventsInMonth(cal, mes).filter(e => e.status === 'publicado').length,
    monthTarget:    goals.month?.target ?? 0,
  }
}
