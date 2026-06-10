import { useCallback, useEffect, useState } from 'react'
import { db, isoDate, today } from '../db'
import { hasSauna } from '../data/library'
import { getRange, placeCustomWorkout } from '../engine/scheduler'
import { Toast, useToast } from '../components/useToast'
import Sheet from '../components/Sheet'
import type { CustomWorkout, ScheduledDay } from '../types'

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
  const [placing, setPlacing] = useState(false)
  const [workouts, setWorkouts] = useState<CustomWorkout[]>([])
  const [toast, showToast] = useToast()

  const loadMonth = useCallback(async () => {
    const from = isoDate(new Date(year, month, 1))
    const to = isoDate(new Date(year, month + 1, 0))
    const rows = await getRange(from, to)
    setDays(new Map(rows.map((r) => [r.date, r])))
  }, [year, month])

  useEffect(() => {
    loadMonth()
  }, [loadMonth])

  function nav(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  async function openPlacer() {
    setWorkouts(await db.customWorkouts.toArray())
    setPlacing(true)
  }

  async function place(w: CustomWorkout, mode: 'insert' | 'replace') {
    try {
      await placeCustomWorkout(selected, w, mode)
      setPlacing(false)
      await loadMonth()
      showToast(`${w.name} ${mode === 'insert' ? 'inserted' : 'placed'} on ${selected}`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not place workout')
    }
  }

  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => isoDate(new Date(year, month, i + 1))),
  ]

  const sel = days.get(selected)
  const canPlace = selected >= today() && sel?.status !== 'completed' && sel?.status !== 'skipped'

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
                  : row.custom
                    ? 'dot-custom'
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
            {sel.status === 'pending' && <span className="pill pill-dim">{sel.custom ? 'Custom' : 'Planned'}</span>}
          </div>
          {sel.sauna && hasSauna() && <div className="tiny" style={{ marginTop: 6 }}>Sauna day{sel.saunaDone ? ' — done' : ''}</div>}
          {sel.deload && <div className="tiny" style={{ marginTop: 4 }}>Deload — lighter targets this week</div>}
          {sel.blocks.length > 0 && (
            <>
              <div className="divider" />
              {sel.blocks.map((b, i) => (
                <div className="row" key={i} style={{ padding: '5px 0' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</span>
                  <span className="tiny">
                    {b.status === 'done'
                      ? '✓'
                      : b.status === 'skipped'
                        ? 'skipped'
                        : b.kind === 'activity'
                          ? `${b.quantity} ${b.unit}`
                          : `${b.sets.length} sets`}
                  </span>
                </div>
              ))}
            </>
          )}
          {canPlace && (
            <>
              <div className="divider" />
              <button className="btn btn-secondary" onClick={openPlacer}>＋ Place a custom workout here</button>
            </>
          )}
        </div>
      ) : (
        <div className="card muted">Nothing scheduled this day.</div>
      )}

      <div className="card" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        <span className="tiny"><span className="cal-dot dot-completed" style={{ display: 'inline-block', marginRight: 5 }} />done</span>
        <span className="tiny"><span className="cal-dot dot-pending" style={{ display: 'inline-block', marginRight: 5 }} />planned</span>
        <span className="tiny"><span className="cal-dot dot-custom" style={{ display: 'inline-block', marginRight: 5 }} />custom</span>
        <span className="tiny"><span className="cal-dot dot-skipped" style={{ display: 'inline-block', marginRight: 5 }} />skipped</span>
      </div>

      {placing && (
        <Sheet title={`Place a workout on ${selected}`} onClose={() => setPlacing(false)}>
          <p className="tiny" style={{ marginBottom: 12 }}>
            <b>Insert</b> pushes the planned workout (and the rest of the week) a day later.
            <b> Replace</b> swaps out that day's planned workout entirely.
          </p>
          {workouts.map((w) => (
            <div className="swap-option" key={w.id} style={{ cursor: 'default' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{w.name} {w.preset && <span className="tiny">· preset</span>}</div>
              <div className="tiny" style={{ margin: '2px 0 8px' }}>{w.focus}</div>
              <div className="btn-row">
                <button className="btn btn-sm btn-primary" onClick={() => place(w, 'insert')}>Insert</button>
                <button className="btn btn-sm btn-secondary" onClick={() => place(w, 'replace')}>Replace</button>
              </div>
            </div>
          ))}
          {workouts.length === 0 && (
            <div className="muted">No custom workouts yet — build one in Profile → My Workouts.</div>
          )}
        </Sheet>
      )}

      <Toast msg={toast} />
    </div>
  )
}
