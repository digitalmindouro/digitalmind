'use client'

import { useState } from 'react'
import { useStore } from '@/lib/state/store'
import { buildCalendarGrid, FORMAT_CONFIG, MONTHS_PT } from '@/lib/utils/marketing'
import { toISODate } from '@/lib/utils/formatters'
import { EventoModal } from './EventoModal'
import type { CalendarEvent } from '@/types/app'

const DAYS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function CalendarioConteudo() {
  const contentCalendar = useStore(s => s.contentCalendar)
  const calYear0  = useStore(s => s.calYear)
  const calMonth0 = useStore(s => s.calMonth)

  const [year, setYear]   = useState(calYear0)
  const [month, setMonth] = useState(calMonth0)

  // Modal state: undefined = closed, null = new event, CalendarEvent = edit
  const [modalDate,  setModalDate]  = useState<string | null>(null)
  const [editEvent,  setEditEvent]  = useState<CalendarEvent | null | undefined>(undefined)

  const today = toISODate(new Date())
  const grid  = buildCalendarGrid(year, month)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  function goToday() {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  function openCreate(date: string) {
    setModalDate(date)
    setEditEvent(null)
  }
  function openEdit(date: string, ev: CalendarEvent, e: React.MouseEvent) {
    e.stopPropagation()
    setModalDate(date)
    setEditEvent(ev)
  }
  function closeModal() {
    setModalDate(null)
    setEditEvent(undefined)
  }

  // Count events this month for the header
  const monthKey  = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthEvs  = Object.entries(contentCalendar)
    .filter(([k]) => k.startsWith(monthKey))
    .flatMap(([, evs]) => evs)
  const totalMonth     = monthEvs.length
  const publishedMonth = monthEvs.filter(e => e.status === 'publicado').length

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            ‹
          </button>
          <h2 className="text-base font-semibold px-2 min-w-[160px] text-center" style={{ color: 'var(--text)' }}>
            {MONTHS_PT[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            ›
          </button>
        </div>

        <button
          onClick={goToday}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          Hoje
        </button>

        <div className="ml-auto flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
          <span>{publishedMonth} publicado{publishedMonth !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{totalMonth - publishedMonth} agendado{totalMonth - publishedMonth !== 1 ? 's' : ''}</span>
          <button
            onClick={() => openCreate(today)}
            className="px-3 py-1.5 rounded-lg font-semibold text-white text-xs"
            style={{ background: 'var(--mk)' }}
          >
            + Conteúdo
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(FORMAT_CONFIG).map(([fmt, conf]) => (
          <span key={fmt} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: conf.color, display: 'inline-block' }} />
            {conf.label}
          </span>
        ))}
      </div>

      {/* Calendar grid — horizontally scrollable on mobile */}
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
        <div style={{ minWidth: 640 }}>
          {/* Day headers */}
          <div className="grid grid-cols-7"
               style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            {DAYS_PT.map(d => (
              <div key={d} className="text-center text-xs py-2 font-medium" style={{ color: 'var(--muted)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Week rows */}
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7"
                 style={{ borderBottom: wi < grid.length - 1 ? '1px solid var(--border)' : 'none' }}>
              {week.map((date, di) => {
                if (!date) return (
                  <div key={di} style={{
                    borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                    minHeight: 88,
                    background: 'var(--surface-2)',
                    opacity: 0.4,
                  }} />
                )

                const dateKey  = toISODate(date)
                const events   = contentCalendar[dateKey] ?? []
                const isToday  = dateKey === today
                const isPast   = dateKey < today
                const isMonth  = dateKey.startsWith(monthKey)

                return (
                  <div
                    key={di}
                    onClick={() => openCreate(dateKey)}
                    className="p-1.5 cursor-pointer transition-colors"
                    style={{
                      borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                      minHeight: 88,
                      background: isToday
                        ? 'rgba(139,92,246,.08)'
                        : !isMonth ? 'var(--surface-2)' : 'var(--surface)',
                    }}
                  >
                    {/* Day number */}
                    <div className={`text-right text-xs mb-1 w-5 h-5 rounded-full flex items-center justify-center ml-auto
                      ${isToday ? 'text-white font-bold' : ''}`}
                         style={{
                           background: isToday ? 'var(--mk)' : 'transparent',
                           color: isToday ? '#fff' : isPast ? 'var(--muted)' : 'var(--text)',
                         }}>
                      {date.getDate()}
                    </div>

                    {/* Events */}
                    {events.slice(0, 3).map(ev => {
                      const conf = FORMAT_CONFIG[ev.formato]
                      return (
                        <div
                          key={ev.id}
                          onClick={e => openEdit(dateKey, ev, e)}
                          className="w-full text-left rounded px-1.5 py-0.5 mb-0.5 truncate text-[10px] font-medium transition-opacity"
                          style={{
                            background: `${conf.color}22`,
                            color: conf.color,
                            opacity: ev.status === 'publicado' ? 1 : 0.75,
                            textDecoration: ev.status === 'publicado' ? 'none' : 'none',
                          }}
                          title={ev.titulo || conf.label}
                        >
                          {ev.status === 'publicado' ? '✓ ' : ''}{ev.titulo || conf.label}
                        </div>
                      )
                    })}

                    {events.length > 3 && (
                      <p className="text-[10px] px-1" style={{ color: 'var(--muted)' }}>
                        +{events.length - 3} mais
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalDate && editEvent !== undefined && (
        <EventoModal
          event={editEvent}
          date={modalDate}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
