import { useCallback, useEffect, useState } from 'react'
import { db, isoDate, today } from '../db'
import { loadHealthLists, labelFor, LOCATION_SYMPTOMS, type HealthLists } from '../health/lists'
import Sheet from '../components/Sheet'
import { Toast, useToast } from '../components/useToast'
import type { HealthEvent, Severity } from '../types'

/**
 * Phase 1 of the health tracker: tap-fast logging (meal < 15s, symptom < 5s),
 * an evening check-in, the confirmed-day marker, and a history with
 * edit/delete. Trends come later; analysis happens in the CSV export.
 */

type SheetKind = 'meal' | 'symptom' | 'checkin'

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function fmtDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function eventSummary(e: HealthEvent, lists: HealthLists): string {
  if (e.type === 'meal') return (e.meal?.categories ?? []).map((c) => labelFor(lists.meals, c)).join(', ')
  if (e.type === 'symptom') {
    const sev = ['', 'mild', 'moderate', 'severe'][e.symptom?.severity ?? 0]
    const loc = e.symptom?.location ? ` (${e.symptom.location})` : ''
    return `${labelFor(lists.symptoms, e.symptom?.symptom ?? '')} — ${sev}${loc}`
  }
  if (e.type === 'context') {
    const c = e.context
    return c ? `Sleep ${c.sleep}/3 · Stress ${c.stress}/3 · Hydration ${c.hydration}/3` : ''
  }
  return 'Day confirmed'
}

const TYPE_LABEL: Record<HealthEvent['type'], string> = {
  meal: 'Meal',
  symptom: 'Symptom',
  context: 'Check-in',
  day_confirm: 'Confirmed',
}

export default function HealthScreen() {
  const [view, setView] = useState<'log' | 'history'>('log')
  const [lists, setLists] = useState<HealthLists | null>(null)
  const [events, setEvents] = useState<HealthEvent[]>([])
  const [sheet, setSheet] = useState<SheetKind | null>(null)
  const [editing, setEditing] = useState<HealthEvent | null>(null)
  const [toast, showToast] = useToast()

  const load = useCallback(async () => {
    setLists(await loadHealthLists())
    setEvents(await db.healthEvents.orderBy('timestamp').reverse().toArray())
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!lists) return <div className="screen" />

  const todayIso = today()
  const todayEvents = events.filter((e) => e.date === todayIso && e.type !== 'day_confirm')
  const confirmed = events.some((e) => e.date === todayIso && e.type === 'day_confirm')
  const confirmedCount = new Set(events.filter((e) => e.type === 'day_confirm').map((e) => e.date)).size

  async function saveEvent(e: HealthEvent) {
    e.date = isoDate(new Date(e.timestamp))
    await db.healthEvents.put(e)
    setSheet(null)
    setEditing(null)
    await load()
    showToast(e.id ? 'Updated' : 'Logged')
  }

  async function deleteEvent(id: number) {
    await db.healthEvents.delete(id)
    setSheet(null)
    setEditing(null)
    await load()
    showToast('Deleted')
  }

  async function toggleConfirm() {
    const existing = events.find((e) => e.date === todayIso && e.type === 'day_confirm')
    if (existing?.id) {
      await db.healthEvents.delete(existing.id)
    } else {
      await db.healthEvents.add({ type: 'day_confirm', timestamp: new Date().toISOString(), date: todayIso })
    }
    await load()
  }

  function openEdit(e: HealthEvent) {
    if (e.type === 'day_confirm') return
    setEditing(e)
    setSheet(e.type === 'context' ? 'checkin' : e.type)
  }

  return (
    <div className="screen">
      <div className="screen-title">Health</div>
      <div className="screen-sub">Tap it in. Spot the trends later.</div>

      <div className="seg" style={{ marginBottom: 14 }}>
        <button className={view === 'log' ? 'on' : ''} onClick={() => setView('log')}>Log</button>
        <button className={view === 'history' ? 'on' : ''} onClick={() => setView('history')}>History</button>
      </div>

      {view === 'log' && (
        <>
          <button className="btn btn-primary btn-log" onClick={() => setSheet('meal')}>
            Log a meal
          </button>
          <button className="btn btn-secondary btn-log" onClick={() => setSheet('symptom')}>
            Log a symptom
          </button>
          <button className="btn btn-secondary btn-log" onClick={() => setSheet('checkin')}>
            Evening check-in
          </button>

          {todayEvents.length > 0 && (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="tiny" style={{ fontWeight: 700, marginBottom: 6 }}>TODAY SO FAR</div>
              {todayEvents.map((e) => (
                <button key={e.id} className="health-row" onClick={() => openEdit(e)}>
                  <span className="tiny" style={{ width: 62, flexShrink: 0 }}>{fmtTime(e.timestamp)}</span>
                  <span className={`pill ${e.type === 'symptom' ? 'pill-red' : 'pill-dim'}`} style={{ flexShrink: 0 }}>{TYPE_LABEL[e.type]}</span>
                  <span className="health-row-text">{eventSummary(e, lists)}</span>
                </button>
              ))}
            </div>
          )}

          <button
            className={`btn ${confirmed ? 'btn-green' : 'btn-ghost'}`}
            style={{ marginTop: 14 }}
            onClick={toggleConfirm}
          >
            {confirmed ? '✓ Day confirmed — nothing unlogged' : 'Confirm today: everything relevant is logged'}
          </button>
          <p className="tiny" style={{ marginTop: 8 }}>
            Confirmed days are the only ones that count as truly symptom-free in your data.
            {confirmedCount > 0 && <> Confirmed so far: <b>{confirmedCount}</b>.</>}
          </p>
        </>
      )}

      {view === 'history' && (
        <HistoryList events={events} lists={lists} onEdit={openEdit} />
      )}

      {sheet === 'meal' && (
        <MealSheet
          lists={lists}
          initial={editing}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onClose={() => { setSheet(null); setEditing(null) }}
        />
      )}
      {sheet === 'symptom' && (
        <SymptomSheet
          lists={lists}
          initial={editing}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onClose={() => { setSheet(null); setEditing(null) }}
        />
      )}
      {sheet === 'checkin' && (
        <CheckinSheet
          initial={editing}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onClose={() => { setSheet(null); setEditing(null) }}
        />
      )}

      <Toast msg={toast} />
    </div>
  )
}

function HistoryList({ events, lists, onEdit }: {
  events: HealthEvent[]
  lists: HealthLists
  onEdit: (e: HealthEvent) => void
}) {
  if (events.length === 0) {
    return <div className="card muted">Nothing logged yet. Meals and symptoms will show up here.</div>
  }
  const byDate = new Map<string, HealthEvent[]>()
  for (const e of events) {
    if (!byDate.has(e.date)) byDate.set(e.date, [])
    byDate.get(e.date)!.push(e)
  }
  return (
    <>
      {[...byDate.entries()].map(([date, list]) => (
        <div className="card" key={date}>
          <div className="tiny" style={{ fontWeight: 700, marginBottom: 6 }}>
            {fmtDate(date).toUpperCase()}
            {list.some((e) => e.type === 'day_confirm') && <span style={{ color: 'var(--green)' }}> · CONFIRMED</span>}
          </div>
          {list.filter((e) => e.type !== 'day_confirm').map((e) => (
            <button key={e.id} className="health-row" onClick={() => onEdit(e)}>
              <span className="tiny" style={{ width: 62, flexShrink: 0 }}>{fmtTime(e.timestamp)}</span>
              <span className={`pill ${e.type === 'symptom' ? 'pill-red' : 'pill-dim'}`} style={{ flexShrink: 0 }}>{TYPE_LABEL[e.type]}</span>
              <span className="health-row-text">{eventSummary(e, lists)}</span>
            </button>
          ))}
          {list.every((e) => e.type === 'day_confirm') && (
            <p className="tiny">No events — confirmed symptom-free.</p>
          )}
        </div>
      ))}
    </>
  )
}

/** Timestamp field with the quick shortcuts the brief asks for. */
function TimeField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  function shortcut(kind: 'now' | '-1h' | '-3h' | 'morning') {
    const d = new Date()
    if (kind === '-1h') d.setHours(d.getHours() - 1)
    if (kind === '-3h') d.setHours(d.getHours() - 3)
    if (kind === 'morning') d.setHours(8, 0, 0, 0)
    onChange(d.toISOString())
  }
  return (
    <div className="field">
      <label>When</label>
      <input
        type="datetime-local"
        className="input"
        value={toLocalInput(value)}
        onChange={(e) => e.target.value && onChange(new Date(e.target.value).toISOString())}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
        <button className="chip" onClick={() => shortcut('now')}>Now</button>
        <button className="chip" onClick={() => shortcut('-1h')}>−1h</button>
        <button className="chip" onClick={() => shortcut('-3h')}>−3h</button>
        <button className="chip" onClick={() => shortcut('morning')}>This morning</button>
      </div>
    </div>
  )
}

function EditorButtons({ canSave, isEdit, onSave, onDelete }: {
  canSave: boolean
  isEdit: boolean
  onSave: () => void
  onDelete: () => void
}) {
  return (
    <div className="btn-row" style={{ marginTop: 4 }}>
      {isEdit && <button className="btn btn-danger" onClick={onDelete}>Delete</button>}
      <button className="btn btn-primary" disabled={!canSave} onClick={onSave}>Save</button>
    </div>
  )
}

function MealSheet({ lists, initial, onSave, onDelete, onClose }: {
  lists: HealthLists
  initial: HealthEvent | null
  onSave: (e: HealthEvent) => void
  onDelete: (id: number) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<string[]>(initial?.meal?.categories ?? [])
  const [ts, setTs] = useState(initial?.timestamp ?? new Date().toISOString())
  const active = lists.meals.filter((m) => !m.archived || selected.includes(m.id))

  return (
    <Sheet title={initial ? 'Edit meal' : 'What was in it?'} onClose={onClose}>
      <div className="chip-grid">
        {active.map((m) => (
          <button
            key={m.id}
            className={`chip ${selected.includes(m.id) ? 'on' : ''}`}
            onClick={() => setSelected((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]))}
          >
            {m.label}
          </button>
        ))}
      </div>
      <TimeField value={ts} onChange={setTs} />
      <EditorButtons
        canSave={selected.length > 0}
        isEdit={!!initial}
        onSave={() => onSave({ ...(initial ?? { type: 'meal' as const, date: '' }), type: 'meal', timestamp: ts, meal: { categories: selected } })}
        onDelete={() => initial?.id && onDelete(initial.id)}
      />
    </Sheet>
  )
}

function SymptomSheet({ lists, initial, onSave, onDelete, onClose }: {
  lists: HealthLists
  initial: HealthEvent | null
  onSave: (e: HealthEvent) => void
  onDelete: (id: number) => void
  onClose: () => void
}) {
  const [symptom, setSymptom] = useState<string | null>(initial?.symptom?.symptom ?? null)
  const [severity, setSeverity] = useState<Severity>(initial?.symptom?.severity ?? 1)
  const [location, setLocation] = useState(initial?.symptom?.location ?? '')
  const [ts, setTs] = useState(initial?.timestamp ?? new Date().toISOString())
  const active = lists.symptoms.filter((s) => !s.archived || s.id === symptom)

  return (
    <Sheet title={initial ? 'Edit symptom' : "What's going on?"} onClose={onClose}>
      <div className="chip-grid">
        {active.map((s) => (
          <button key={s.id} className={`chip ${symptom === s.id ? 'on' : ''}`} onClick={() => setSymptom(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label>How bad?</label>
        <div className="seg">
          {([1, 2, 3] as Severity[]).map((n) => (
            <button key={n} className={severity === n ? 'on' : ''} onClick={() => setSeverity(n)}>
              {['Mild', 'Moderate', 'Severe'][n - 1]}
            </button>
          ))}
        </div>
      </div>
      {symptom && LOCATION_SYMPTOMS.has(symptom) && (
        <div className="field">
          <label>Where? (optional)</label>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. left forearm" />
        </div>
      )}
      <TimeField value={ts} onChange={setTs} />
      <EditorButtons
        canSave={!!symptom}
        isEdit={!!initial}
        onSave={() => onSave({
          ...(initial ?? { type: 'symptom' as const, date: '' }),
          type: 'symptom',
          timestamp: ts,
          symptom: { symptom: symptom!, severity, ...(location.trim() ? { location: location.trim() } : {}) },
        })}
        onDelete={() => initial?.id && onDelete(initial.id)}
      />
    </Sheet>
  )
}

function CheckinSheet({ initial, onSave, onDelete, onClose }: {
  initial: HealthEvent | null
  onSave: (e: HealthEvent) => void
  onDelete: (id: number) => void
  onClose: () => void
}) {
  const [sleep, setSleep] = useState<Severity>(initial?.context?.sleep ?? 2)
  const [stress, setStress] = useState<Severity>(initial?.context?.stress ?? 2)
  const [hydration, setHydration] = useState<Severity>(initial?.context?.hydration ?? 2)
  const [ts, setTs] = useState(initial?.timestamp ?? new Date().toISOString())

  const row = (label: string, value: Severity, set: (n: Severity) => void, names: string[]) => (
    <div className="field">
      <label>{label}</label>
      <div className="seg">
        {([1, 2, 3] as Severity[]).map((n) => (
          <button key={n} className={value === n ? 'on' : ''} onClick={() => set(n)}>{names[n - 1]}</button>
        ))}
      </div>
    </div>
  )

  return (
    <Sheet title={initial ? 'Edit check-in' : 'How was today?'} onClose={onClose}>
      {row('Sleep last night', sleep, setSleep, ['Poor', 'OK', 'Good'])}
      {row('Stress', stress, setStress, ['Low', 'Medium', 'High'])}
      {row('Hydration', hydration, setHydration, ['Low', 'OK', 'Good'])}
      <TimeField value={ts} onChange={setTs} />
      <EditorButtons
        canSave
        isEdit={!!initial}
        onSave={() => onSave({ ...(initial ?? { type: 'context' as const, date: '' }), type: 'context', timestamp: ts, context: { sleep, stress, hydration } })}
        onDelete={() => initial?.id && onDelete(initial.id)}
      />
    </Sheet>
  )
}
