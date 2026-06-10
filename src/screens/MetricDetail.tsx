import LineChart from '../components/LineChart'
import Sheet from '../components/Sheet'
import { summarize, type AllMetrics, type DayMetric } from '../engine/metrics'
import type { BodyMetric } from '../types'

export type MetricKey = 'calories' | 'volume' | 'workouts' | 'sauna' | 'streak' | 'bodyweight'

const META: Record<MetricKey, { title: string; unit: string; icon: string; blurb: string }> = {
  calories: { title: 'Calories Burned', unit: 'kcal', icon: '🔥', blurb: 'MET-based estimates from your logged work and body weight — built for trends, not lab precision.' },
  volume: { title: 'Weight Moved', unit: '', icon: '🏋️', blurb: 'Every logged rep × weight, plus bodyweight reps scaled by how much of you each move lifts.' },
  workouts: { title: 'Workouts', unit: '', icon: '✅', blurb: 'Completed training days (rest days don’t count toward the total).' },
  sauna: { title: 'Sauna Sessions', unit: '', icon: '🧖', blurb: 'Checked-off sauna sessions.' },
  streak: { title: 'Streak', unit: 'days', icon: '⚡', blurb: 'Consecutive training days completed. Rest days don’t break it; skips do.' },
  bodyweight: { title: 'Body Weight', unit: '', icon: '⚖️', blurb: 'Your logged weigh-ins.' },
}

function fmtNum(n: number): string {
  return n >= 10000 ? `${Math.round(n / 1000)}k` : String(Math.round(n))
}

export default function MetricDetail({
  metric,
  metrics,
  weights,
  unit,
  onClose,
}: {
  metric: MetricKey
  metrics: AllMetrics
  weights: BodyMetric[]
  unit: 'lb' | 'kg'
  onClose: () => void
}) {
  const meta = META[metric]
  const volumeUnit = unit === 'lb' ? 'lb' : 'kg'

  let rows: { label: string; value: string }[] = []
  let points: DayMetric[] | null = null
  let chart: { label: string; value: number }[] = []
  let chartUnit = meta.unit

  if (metric === 'streak') {
    rows = [
      { label: 'Current streak', value: `${metrics.streak} days` },
      { label: 'Longest streak', value: `${metrics.longestStreak} days` },
      { label: 'Workouts completed', value: String(metrics.completed) },
      { label: 'Workouts skipped', value: String(metrics.skipped) },
    ]
    const s = summarize(metrics.workouts)
    chart = s.weekly
    chartUnit = 'workouts/wk'
  } else if (metric === 'bodyweight') {
    const latest = weights.length ? weights[weights.length - 1].weight : 0
    const monthAgoIdx = weights.findIndex((w) => w.date >= new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10))
    const monthAgo = monthAgoIdx >= 0 ? weights[monthAgoIdx].weight : latest
    const first = weights.length ? weights[0].weight : 0
    rows = [
      { label: 'Current', value: `${latest} ${unit}` },
      { label: 'Past 30 days', value: `${(latest - monthAgo) > 0 ? '+' : ''}${Math.round((latest - monthAgo) * 10) / 10} ${unit}` },
      { label: 'Since you started', value: `${(latest - first) > 0 ? '+' : ''}${Math.round((latest - first) * 10) / 10} ${unit}` },
      { label: 'Weigh-ins logged', value: String(weights.length) },
    ]
    chart = weights.map((w) => ({ label: `${Number(w.date.slice(5, 7))}/${Number(w.date.slice(8))}`, value: w.weight }))
    chartUnit = unit
  } else {
    points = metrics[metric]
    const s = summarize(points)
    const u = metric === 'volume' ? ` ${volumeUnit}` : metric === 'calories' ? ' kcal' : ''
    const delta = s.thisWeek - s.lastWeek
    rows = [
      { label: 'This week', value: `${fmtNum(s.thisWeek)}${u}` },
      { label: 'Last week', value: `${fmtNum(s.lastWeek)}${u}` },
      { label: 'vs last week', value: `${delta >= 0 ? '+' : ''}${fmtNum(delta)}${u}` },
      { label: 'Past 30 days', value: `${fmtNum(s.past30)}${u}` },
      { label: 'Lifetime', value: `${fmtNum(s.lifetime)}${u}` },
    ]
    chart = s.weekly
    chartUnit = metric === 'volume' ? `${volumeUnit}/wk` : metric === 'calories' ? 'kcal/wk' : 'per week'
  }

  return (
    <Sheet title={meta.title} onClose={onClose}>
        <div className="card" style={{ marginBottom: 12 }}>
          {rows.map((r) => (
            <div className="row" key={r.label} style={{ padding: '7px 0' }}>
              <span className="muted">{r.label}</span>
              <span style={{ fontWeight: 800 }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="tiny" style={{ marginBottom: 6, fontWeight: 700 }}>
            {metric === 'bodyweight' ? 'ALL WEIGH-INS' : 'LAST 12 WEEKS'} ({chartUnit})
          </div>
          <LineChart points={chart} unit="" />
        </div>
        <p className="tiny" style={{ marginTop: 4 }}>{meta.blurb}</p>
        <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={onClose}>Close</button>
    </Sheet>
  )
}
