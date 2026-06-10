import { useEffect, useState } from 'react'
import { isoDate, today } from '../db'
import { getRange } from '../engine/scheduler'
import type { ScheduledDay } from '../types'

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function CalendarScreen() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [days, setDays] = useState<Map<string, ScheduledDay>>(new Map())
  const [selected, setSelected] = useState<string>(today())

  useEffect(() => {
    const from = isoDate(new Date(year, month, 1))
    const to = isoDate(new Date(year, month + 1, 0))
    getRange(from, to).then((rows) => setDays(new Map(rows.map((r) => [r.date, r]))))
  }, [year, month])

  function nav(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => isoDate(new Date(year, month, i + 1))),
  ]

  const sel = days.get(selected)

  return (
    <div className="screen">
      <div className="screen-title">Calendar</div>
      <div className="screen-sub">Your training month at a glance</div>

      <div className="card">
        <div className="cal-head">
          <button className="btn btn-sm btn-secondary" onClick={() => nav(-1)}>←</button>
          <div className="cal-month">{MONTHS[month]} {year}</div>
          <button className="btn btn-sm btn-secondary" onClick={() => nav(1)}>→</button>
        </div>
        <div className="cal-grid">
          {DOW.map((d, i) => (
            <div className="cal-dow" key={i}>{d}</div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div key={`x${i}`} />
            const row = days.get(date)
            const dotClass = !row || row.templateKey === 'rest'
              ? 'dot-rest'
              : row.status === 'completed'
                ? 'dot-completed'
                : row.status === 'skipped'
                  ? 'dot-skipped'
                  : 'dot-pending'
            return (
              <button
                key={date}
                className={`cal-cell ${date === today() ? 'today' : ''} ${date === selected ? 'sel' : ''}`}
                onClick={() => setSelected(date)}
              >
                {Number(date.slice(8))}
                <span className={`cal-dot ${dotClass}`} />
              </button>
            )
          })}
        </div>
      </div>

      {sel ? (
        <div className="card">
          <div className="row">
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{sel.title}</div>
              <div className="muted">{sel.focus}</div>
            </div>
            {sel.status === 'completed' && <span className="pill pill-green">✓ Done</span>}
            {sel.status === 'skipped' && <span className="pill pill-red">Skipped</span>}
            {sel.status === 'pending' && <span className="pill pill-dim">Planned</span>}
          </div>
          {sel.sauna && <div className="tiny" style={{ marginTop: 6 }}>🔥 Sauna day{sel.saunaDone ? ' — done' : ''}</div>}
          {sel.blocks.length > 0 && (
            <>
              <div className="divider" />
              {sel.blocks.map((b, i) => (
                <div className="row" key={i} style={{ padding: '5px 0' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</span>
                  <span className="tiny">
                    {b.status === 'done' ? '✓' : b.status === 'skipped' ? 'skipped' : `${b.sets.length} sets`}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="card muted">Nothing scheduled this day.</div>
      )}

      <div className="card" style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <span className="tiny"><span className="cal-dot dot-completed" style={{ display: 'inline-block', marginRight: 5 }} />done</span>
        <span className="tiny"><span className="cal-dot dot-pending" style={{ display: 'inline-block', marginRight: 5 }} />planned</span>
        <span className="tiny"><span className="cal-dot dot-skipped" style={{ display: 'inline-block', marginRight: 5 }} />skipped</span>
      </div>
    </div>
  )
}
