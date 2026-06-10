import { useCallback, useEffect, useMemo, useState } from 'react'
import { db, today } from '../db'
import { getStats, type Stats } from '../engine/scheduler'
import { EXERCISES } from '../data/exercises'
import LineChart from '../components/LineChart'
import { useToast } from '../components/useToast'
import type { BodyMetric, Profile, ScheduledDay } from '../types'

const TRACKED_LIFTS = EXERCISES.filter((e) => e.kind === 'weighted').map((e) => ({ id: e.id, name: e.name }))

function shortDate(iso: string): string {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8))}`
}

export default function ProgressScreen({ profile }: { profile: Profile }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [metrics, setMetrics] = useState<BodyMetric[]>([])
  const [history, setHistory] = useState<ScheduledDay[]>([])
  const [lift, setLift] = useState('bench-press')
  const [newWeight, setNewWeight] = useState('')
  const [toast, showToast] = useToast()

  const load = useCallback(async () => {
    setStats(await getStats())
    setMetrics(await db.metrics.orderBy('date').toArray())
    const done = await db.schedule.where('status').equals('completed').sortBy('date')
    setHistory(done)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const liftPoints = useMemo(() => {
    const pts: { label: string; value: number }[] = []
    for (const day of history) {
      for (const b of day.blocks) {
        if (b.exerciseId !== lift || b.status !== 'done') continue
        const top = Math.max(0, ...b.sets.filter((s) => s.done).map((s) => s.actualWeight ?? 0))
        if (top > 0) pts.push({ label: shortDate(day.date), value: top })
      }
    }
    return pts
  }, [history, lift])

  const weightPoints = metrics.map((m) => ({ label: shortDate(m.date), value: m.weight }))

  async function logWeight() {
    const w = Number(newWeight)
    if (!w || w <= 0) return
    const existing = await db.metrics.where('date').equals(today()).first()
    if (existing?.id) await db.metrics.update(existing.id, { weight: w })
    else await db.metrics.add({ date: today(), weight: w })
    setNewWeight('')
    await load()
    showToast('Body weight logged')
  }

  return (
    <div className="screen">
      <div className="screen-title">Progress</div>
      <div className="screen-sub">Every session moves the needle</div>

      <div className="stat-grid">
        <div className="stat"><div className="stat-num">{stats?.streak ?? 0}</div><div className="stat-label">🔥 day streak</div></div>
        <div className="stat"><div className="stat-num">{stats?.completed ?? 0}</div><div className="stat-label">workouts completed</div></div>
        <div className="stat"><div className="stat-num">{stats?.saunaSessions ?? 0}</div><div className="stat-label">sauna sessions</div></div>
        <div className="stat"><div className="stat-num">{stats?.skipped ?? 0}</div><div className="stat-label">skipped</div></div>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 6 }}>
          <span style={{ fontWeight: 800 }}>Body weight</span>
        </div>
        <LineChart points={weightPoints} unit={profile.unit} color="var(--blue)" />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            className="input"
            inputMode="decimal"
            placeholder={`Today's weight (${profile.unit})`}
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
          />
          <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={logWeight}>Log</button>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <span style={{ fontWeight: 800 }}>Lift strength</span>
        </div>
        <select className="input" value={lift} onChange={(e) => setLift(e.target.value)} style={{ marginBottom: 8 }}>
          {TRACKED_LIFTS.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <LineChart points={liftPoints} unit={profile.unit} />
        <p className="tiny" style={{ marginTop: 8 }}>
          Top working-set weight per completed session. Hit the top of the rep range on every set and the app
          raises the target automatically.
        </p>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
