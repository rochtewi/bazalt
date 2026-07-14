import { useState } from 'react'
import { addDays, today } from '../db'
import LineChart from '../components/LineChart'
import { labelFor, type HealthLists } from './lists'
import type { HealthEvent } from '../types'

/**
 * Honest, simple trends — counts, timelines, and rolling averages with the
 * sample sizes visible. No correlation math in-app: that happens in the CSV
 * export, where the confirmed-day flag travels with every row.
 */

type Range = 30 | 90 | 180

const SYMPTOM_COLORS = [
  'var(--accent)', 'var(--red)', 'var(--blue)', 'var(--green)', 'var(--amber)',
  '#c084fc', '#f472b6', '#2dd4bf', '#a3e635', '#fb923c', '#94a3b8', '#e879f9',
]

function lastNDates(n: number): string[] {
  const t = today()
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) out.push(addDays(t, -i))
  return out
}

function rolling7(values: number[]): number[] {
  return values.map((_, i) => {
    const from = Math.max(0, i - 6)
    const slice = values.slice(from, i + 1)
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 100) / 100
  })
}

function shortDate(iso: string): string {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8))}`
}

export default function Trends({ events, lists }: { events: HealthEvent[]; lists: HealthLists }) {
  const [range, setRange] = useState<Range>(30)
  const dates = lastNDates(range)
  const from = dates[0]
  const inRange = events.filter((e) => e.date >= from)

  const confirmed = new Set(inRange.filter((e) => e.type === 'day_confirm').map((e) => e.date))
  const symptoms = inRange.filter((e) => e.type === 'symptom')
  const meals = inRange.filter((e) => e.type === 'meal')
  const checkins = inRange.filter((e) => e.type === 'context')

  // ---- symptom timeline: one lane per symptom seen in range ----
  const laneIds = [...new Set(symptoms.map((e) => e.symptom!.symptom))]
  const laneColor = new Map(laneIds.map((id, i) => [id, SYMPTOM_COLORS[i % SYMPTOM_COLORS.length]]))

  // ---- daily symptom load + 7-day rolling mean ----
  const loadByDate = new Map<string, number>(dates.map((d) => [d, 0]))
  for (const s of symptoms) {
    loadByDate.set(s.date, (loadByDate.get(s.date) ?? 0) + s.symptom!.severity)
  }
  const dailyLoad = dates.map((d) => loadByDate.get(d) ?? 0)
  const rolledLoad = rolling7(dailyLoad)
  const loadPoints = dates.map((d, i) => ({ label: shortDate(d), value: rolledLoad[i] }))

  // ---- check-in rolling means ----
  const ciSeries = (key: 'mood' | 'energy' | 'func') => {
    const byDate = new Map<string, number[]>()
    for (const c of checkins) {
      const v = c.context?.[key]
      if (v == null) continue
      if (!byDate.has(c.date)) byDate.set(c.date, [])
      byDate.get(c.date)!.push(v)
    }
    // carry the daily mean forward through gaps so the rolling line is continuous
    const daily: number[] = []
    let prev = 2
    for (const d of dates) {
      const vals = byDate.get(d)
      if (vals?.length) prev = vals.reduce((a, b) => a + b, 0) / vals.length
      daily.push(prev)
    }
    return rolling7(daily)
  }
  const hasCheckins = checkins.some((c) => c.context?.mood != null)
  const moodLine = ciSeries('mood')
  const energyLine = ciSeries('energy')
  const funcLine = ciSeries('func')

  // ---- top ingredients ----
  const counts = new Map<string, number>()
  for (const m of meals) for (const c of m.meal?.categories ?? []) counts.set(c, (counts.get(c) ?? 0) + 1)
  const topIngredients = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  const maxCount = topIngredients[0]?.[1] ?? 1

  const TL_W = 480
  const TL_LABEL = 88
  const LANE_H = 24
  const tlH = Math.max(1, laneIds.length) * LANE_H + 26
  const dayX = (date: string) => {
    const idx = dates.indexOf(date)
    return TL_LABEL + ((idx + 0.5) * (TL_W - TL_LABEL - 8)) / range
  }

  return (
    <>
      <div className="seg" style={{ marginBottom: 12 }}>
        {([30, 90, 180] as Range[]).map((r) => (
          <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>{r} days</button>
        ))}
      </div>

      <div className="card">
        <div className="tiny" style={{ fontWeight: 700, marginBottom: 6 }}>DATA QUALITY</div>
        <div style={{ fontWeight: 800, fontSize: 20 }}>{confirmed.size} <span className="tiny">of {range} days confirmed</span></div>
        <p className="tiny" style={{ marginTop: 4 }}>
          Only confirmed days count as truly symptom-free. {symptoms.length} symptom logs and {meals.length} meals in this window.
        </p>
      </div>

      <div className="card">
        <div className="tiny" style={{ fontWeight: 700, marginBottom: 8 }}>SYMPTOM TIMELINE <span style={{ fontWeight: 400 }}>(dot size = severity)</span></div>
        {laneIds.length === 0 ? (
          <p className="muted">No symptoms logged in this window.</p>
        ) : (
          <svg viewBox={`0 0 ${TL_W} ${tlH}`} style={{ width: '100%', height: 'auto' }} role="img">
            {laneIds.map((id, i) => (
              <g key={id}>
                <text x={0} y={i * LANE_H + 16} fill={laneColor.get(id)} fontSize={11} fontWeight={700}>
                  {labelFor(lists.symptoms, id).slice(0, 13)}
                </text>
                <line x1={TL_LABEL} y1={i * LANE_H + 12} x2={TL_W - 8} y2={i * LANE_H + 12} stroke="var(--border)" strokeWidth={1} />
              </g>
            ))}
            {symptoms.map((s, i) => {
              const lane = laneIds.indexOf(s.symptom!.symptom)
              return (
                <circle
                  key={i}
                  cx={dayX(s.date)}
                  cy={lane * LANE_H + 12}
                  r={2 + s.symptom!.severity * 1.6}
                  fill={laneColor.get(s.symptom!.symptom)}
                  opacity={0.85}
                />
              )
            })}
            <text x={TL_LABEL} y={tlH - 4} fill="var(--text-faint)" fontSize={11}>{shortDate(dates[0])}</text>
            <text x={TL_W - 8} y={tlH - 4} fill="var(--text-faint)" fontSize={11} textAnchor="end">{shortDate(dates[dates.length - 1])}</text>
          </svg>
        )}
      </div>

      <div className="card">
        <div className="tiny" style={{ fontWeight: 700, marginBottom: 6 }}>SYMPTOM LOAD <span style={{ fontWeight: 400 }}>(7-day rolling — lower is better)</span></div>
        {symptoms.length === 0 ? (
          <p className="muted">Nothing to chart yet.</p>
        ) : (
          <LineChart points={loadPoints} color="var(--red)" unit="" />
        )}
      </div>

      <div className="card">
        <div className="tiny" style={{ fontWeight: 700, marginBottom: 6 }}>CHECK-IN TRENDS <span style={{ fontWeight: 400 }}>(7-day rolling, 1–3)</span></div>
        {!hasCheckins ? (
          <p className="muted">Log a few check-ins and the mood / energy / function lines appear here.</p>
        ) : (
          <MultiLine
            dates={dates}
            series={[
              { name: 'Mood', color: 'var(--accent)', values: moodLine },
              { name: 'Energy', color: 'var(--blue)', values: energyLine },
              { name: 'Function', color: 'var(--green)', values: funcLine },
            ]}
          />
        )}
      </div>

      <div className="card">
        <div className="tiny" style={{ fontWeight: 700, marginBottom: 8 }}>MOST-LOGGED INGREDIENTS</div>
        {topIngredients.length === 0 ? (
          <p className="muted">No meals logged in this window.</p>
        ) : (
          topIngredients.map(([id, n]) => (
            <div key={id} className="row" style={{ padding: '4px 0', gap: 8 }}>
              <span style={{ fontSize: 13, width: 130, flexShrink: 0 }}>{labelFor(lists.meals, id)}</span>
              <span style={{ flex: 1, height: 10, background: 'var(--bg-input)', borderRadius: 5, overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${(n / maxCount) * 100}%`, background: 'var(--accent)', borderRadius: 5 }} />
              </span>
              <span className="tiny" style={{ width: 26, textAlign: 'right' }}>{n}</span>
            </div>
          ))
        )}
      </div>

      <p className="tiny" style={{ margin: '4px 0 10px' }}>
        Patterns, not proof — for food–symptom correlation, export the health log from Profile and dig in.
      </p>
    </>
  )
}

function MultiLine({ dates, series }: {
  dates: string[]
  series: { name: string; color: string; values: number[] }[]
}) {
  const W = 480
  const H = 150
  const PAD = 24
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (dates.length - 1)
  const y = (v: number) => H - PAD - ((v - 1) / 2) * (H - PAD * 2) // fixed 1..3 scale

  return (
    <div className="chart-wrap">
      <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
        {series.map((s) => (
          <span key={s.name} className="tiny" style={{ color: s.color, fontWeight: 700 }}>— {s.name}</span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img">
        {[1, 2, 3].map((v) => (
          <line key={v} x1={PAD} y1={y(v)} x2={W - PAD} y2={y(v)} stroke="var(--border)" strokeWidth={1} />
        ))}
        {series.map((s) => (
          <path
            key={s.name}
            d={s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        <text x={PAD} y={H - 6} fill="var(--text-faint)" fontSize={11}>{shortDate(dates[0])}</text>
        <text x={W - PAD} y={H - 6} fill="var(--text-faint)" fontSize={11} textAnchor="end">{shortDate(dates[dates.length - 1])}</text>
      </svg>
    </div>
  )
}
