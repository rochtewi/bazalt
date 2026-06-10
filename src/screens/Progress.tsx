import { useCallback, useEffect, useMemo, useState } from 'react'
import { db, today } from '../db'
import { getAllMetrics, summarize, type AllMetrics } from '../engine/metrics'
import { availableExercises, hasSauna } from '../data/library'
import LineChart from '../components/LineChart'
import MetricDetail, { type MetricKey } from './MetricDetail'
import { useToast } from '../components/useToast'
import type { BodyMetric, Profile, ScheduledDay } from '../types'

function shortDate(iso: string): string {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8))}`
}

function fmtNum(n: number): string {
  return n >= 10000 ? `${Math.round(n / 1000)}k` : String(Math.round(n))
}

export default function ProgressScreen({ profile }: { profile: Profile }) {
  const [metrics, setMetrics] = useState<AllMetrics | null>(null)
  const [weights, setWeights] = useState<BodyMetric[]>([])
  const [history, setHistory] = useState<ScheduledDay[]>([])
  const [lift, setLift] = useState('bench-press')
  const [newWeight, setNewWeight] = useState('')
  const [detail, setDetail] = useState<MetricKey | null>(null)
  const [toast, showToast] = useToast()

  const trackedLifts = useMemo(
    () => availableExercises().filter((e) => e.kind === 'weighted').map((e) => ({ id: e.id, name: e.name })),
    [],
  )

  const load = useCallback(async () => {
    setMetrics(await getAllMetrics(profile))
    setWeights(await db.metrics.orderBy('date').toArray())
    setHistory(await db.schedule.where('status').equals('completed').sortBy('date'))
  }, [profile])

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

  const cal = metrics ? summarize(metrics.calories) : null
  const vol = metrics ? summarize(metrics.volume) : null
  const calDelta = cal ? cal.thisWeek - cal.lastWeek : 0
  const volDelta = vol ? vol.thisWeek - vol.lastWeek : 0
  const latestWeight = weights.length ? weights[weights.length - 1].weight : null

  return (
    <div className="screen">
      <div className="screen-title">Progress</div>
      <div className="screen-sub">Tap any card for the full breakdown</div>

      <div className="stat-grid">
        <button className="stat" onClick={() => setDetail('streak')}>
          <div className="stat-num">{metrics?.streak ?? 0}</div>
          <div className="stat-label">day streak</div>
        </button>
        <button className="stat" onClick={() => setDetail('workouts')}>
          <div className="stat-num">{metrics?.completed ?? 0}</div>
          <div className="stat-label">workouts done</div>
        </button>
        <button className="stat" onClick={() => setDetail('calories')}>
          <div className="stat-num">{cal ? fmtNum(cal.thisWeek) : 0}</div>
          <div className="stat-label">
            kcal this week{' '}
            {cal && cal.lastWeek > 0 && (
              <span className={calDelta >= 0 ? 'delta-up' : 'delta-down'}>
                {calDelta >= 0 ? '▲' : '▼'}{fmtNum(Math.abs(calDelta))}
              </span>
            )}
          </div>
        </button>
        <button className="stat" onClick={() => setDetail('volume')}>
          <div className="stat-num">{vol ? fmtNum(vol.thisWeek) : 0}</div>
          <div className="stat-label">
            {profile.unit} moved this wk{' '}
            {vol && vol.lastWeek > 0 && (
              <span className={volDelta >= 0 ? 'delta-up' : 'delta-down'}>
                {volDelta >= 0 ? '▲' : '▼'}{fmtNum(Math.abs(volDelta))}
              </span>
            )}
          </div>
        </button>
        {hasSauna() && (
          <button className="stat" onClick={() => setDetail('sauna')}>
            <div className="stat-num">{metrics?.sauna.length ?? 0}</div>
            <div className="stat-label">sauna sessions</div>
          </button>
        )}
        <button className="stat" onClick={() => setDetail('bodyweight')}>
          <div className="stat-num">{latestWeight ?? '—'}</div>
          <div className="stat-label">body weight ({profile.unit})</div>
        </button>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 6 }}>
          <span style={{ fontWeight: 800 }}>Body weight</span>
        </div>
        <LineChart
          points={weights.map((m) => ({ label: shortDate(m.date), value: m.weight }))}
          unit={profile.unit}
          color="var(--blue)"
        />
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
          {trackedLifts.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <LineChart points={liftPoints} unit={profile.unit} />
        <p className="tiny" style={{ marginTop: 8 }}>
          Top working-set weight per completed session. Hit the top of the rep range on every set and the app
          raises the target automatically.
        </p>
      </div>

      {detail && metrics && (
        <MetricDetail metric={detail} metrics={metrics} weights={weights} unit={profile.unit} onClose={() => setDetail(null)} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
