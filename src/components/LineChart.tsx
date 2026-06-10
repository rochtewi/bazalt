interface Point {
  label: string
  value: number
}

/** Dependency-free SVG line chart. */
export default function LineChart({ points, color = 'var(--accent)', unit = '' }: { points: Point[]; color?: string; unit?: string }) {
  if (points.length === 0) return <div className="muted">No data yet — log something first.</div>

  const W = 480
  const H = 160
  const PAD = 28
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const lo = min - span * 0.1
  const hi = max + span * 0.1

  const x = (i: number) => (points.length === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (points.length - 1))
  const y = (v: number) => H - PAD - ((v - lo) / (hi - lo)) * (H - PAD * 2)

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  const first = points[0]
  const delta = last.value - first.value

  return (
    <div className="chart-wrap">
      <div className="row" style={{ marginBottom: 4 }}>
        <span style={{ fontWeight: 800, fontSize: 20 }}>
          {last.value}
          <span className="tiny"> {unit}</span>
        </span>
        {points.length > 1 && (
          <span className={`pill ${delta <= 0 ? 'pill-green' : 'pill-accent'}`}>
            {delta > 0 ? '+' : ''}{Math.round(delta * 10) / 10} {unit} total
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img">
        <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={3.5} fill={color} />
        ))}
        <text x={PAD} y={H - 6} fill="var(--text-faint)" fontSize={11}>{first.label}</text>
        <text x={W - PAD} y={H - 6} fill="var(--text-faint)" fontSize={11} textAnchor="end">{last.label}</text>
      </svg>
    </div>
  )
}
