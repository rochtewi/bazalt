import { useEffect, useMemo, useRef, useState } from 'react'
import type { WorkoutBlock } from '../types'

interface Phase {
  label: string
  seconds: number
  tone: 'ready' | 'work' | 'rest'
}

function buildPhases(block: WorkoutBlock): Phase[] {
  const phases: Phase[] = [{ label: 'GET READY', seconds: 5, tone: 'ready' }]
  if (block.kind === 'intervals') {
    const rounds = block.rounds ?? 6
    for (let r = 1; r <= rounds; r++) {
      phases.push({ label: `ROUND ${r}/${rounds} — GO!`, seconds: block.workSeconds ?? 20, tone: 'work' })
      if (r < rounds) phases.push({ label: `ROUND ${r}/${rounds} — RECOVER`, seconds: block.restSeconds ?? 100, tone: 'rest' })
    }
  } else {
    phases.push({ label: block.name.toUpperCase(), seconds: block.seconds ?? 45, tone: 'work' })
  }
  return phases
}

let audioCtx: AudioContext | null = null
function beep(freq: number, ms = 180) {
  try {
    audioCtx ??= new AudioContext()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.frequency.value = freq
    gain.gain.value = 0.12
    osc.connect(gain).connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + ms / 1000)
  } catch {
    // Audio is best-effort; some browsers block it.
  }
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : String(sec)
}

export default function TimerOverlay({ block, onDone, onClose }: { block: WorkoutBlock; onDone: () => void; onClose: () => void }) {
  const phases = useMemo(() => buildPhases(block), [block])
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [remaining, setRemaining] = useState(phases[0].seconds)
  const [running, setRunning] = useState(true)
  const [finished, setFinished] = useState(false)
  const endRef = useRef(Date.now() + phases[0].seconds * 1000)

  useEffect(() => {
    if (!running || finished) return
    const tick = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) {
        setPhaseIdx((idx) => {
          const next = idx + 1
          if (next >= phases.length) {
            setFinished(true)
            beep(880, 400)
            return idx
          }
          beep(phases[next].tone === 'work' ? 880 : 440)
          endRef.current = Date.now() + phases[next].seconds * 1000
          setRemaining(phases[next].seconds)
          return next
        })
      } else if (left <= 3 && phases[phaseIdx].tone !== 'rest') {
        beep(660, 80)
      }
    }, 200)
    return () => window.clearInterval(tick)
  }, [running, finished, phases, phaseIdx])

  function togglePause() {
    if (running) {
      setRunning(false)
    } else {
      endRef.current = Date.now() + remaining * 1000
      setRunning(true)
    }
  }

  const phase = phases[phaseIdx]
  const progress = finished ? 1 : 1 - remaining / phase.seconds
  const R = 86
  const CIRC = 2 * Math.PI * R
  const color = finished
    ? 'var(--green)'
    : phase.tone === 'ready'
      ? 'var(--amber)'
      : phase.tone === 'work'
        ? 'var(--accent)'
        : 'var(--blue)'

  return (
    <div className="timer-back">
      <div className="timer-card">
        <div className="timer-label" style={{ color }}>
          {finished ? 'DONE 💪' : phase.label}
        </div>
        <svg viewBox="0 0 200 200" className="timer-ring">
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border)" strokeWidth="10" />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 0.2s linear' }}
          />
          <text x="100" y="112" textAnchor="middle" fill="var(--text)" fontSize="44" fontWeight="800">
            {finished ? '✓' : fmt(remaining)}
          </text>
        </svg>
        {!finished ? (
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={togglePause}>{running ? 'Pause' : 'Resume'}</button>
            <button className="btn btn-danger" onClick={onClose}>Exit</button>
          </div>
        ) : (
          <div className="btn-row">
            <button className="btn btn-green" onClick={onDone}>Mark done ✓</button>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}
