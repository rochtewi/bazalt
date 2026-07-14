import { useState } from 'react'
import { db } from '../db'
import { EQUIPMENT_LABELS } from '../data/exercises'
import { allExercises, loadLibrary, owned } from '../data/library'
import { rebuildPendingDays } from '../engine/scheduler'
import Sheet from './Sheet'
import type { Equipment, ExerciseDef, MovementPattern, Profile } from '../types'

const TOGGLABLE = (Object.keys(EQUIPMENT_LABELS) as Equipment[]).filter((e) => e !== 'bodyweight')

const PATTERNS: { id: MovementPattern; label: string }[] = [
  { id: 'horizontal-push', label: 'Push (chest)' },
  { id: 'vertical-push', label: 'Push (overhead)' },
  { id: 'horizontal-pull', label: 'Pull (row)' },
  { id: 'vertical-pull', label: 'Pull (chin/pull-up)' },
  { id: 'hinge', label: 'Hinge (deadlift)' },
  { id: 'squat', label: 'Squat' },
  { id: 'lunge', label: 'Lunge / single leg' },
  { id: 'glute', label: 'Glutes' },
  { id: 'arms', label: 'Arms' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'calves', label: 'Calves' },
  { id: 'core', label: 'Core' },
  { id: 'conditioning', label: 'Conditioning' },
]

export default function EquipmentManager({
  profile,
  onChanged,
  notify,
}: {
  profile: Profile
  onChanged: () => void
  notify: (msg: string) => void
}) {
  const [selected, setSelected] = useState<Equipment[]>(owned())
  const [building, setBuilding] = useState(false)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'weighted' | 'bodyweight' | 'timed'>('weighted')
  const [pattern, setPattern] = useState<MovementPattern>('horizontal-push')
  const [gear, setGear] = useState<Equipment[]>([])
  const [repLo, setRepLo] = useState('8')
  const [repHi, setRepHi] = useState('12')
  const [startW, setStartW] = useState('45')
  const [seconds, setSeconds] = useState('45')

  const customs = allExercises().filter((e) => e.custom)
  const unlocked = allExercises().filter((e) => !e.custom && e.equipment.every((q) => selected.includes(q) || q === 'bodyweight')).length

  function toggle(eq: Equipment) {
    setSelected((s) => (s.includes(eq) ? s.filter((x) => x !== eq) : [...s, eq]))
  }

  async function save() {
    const equipment: Equipment[] = [...selected.filter((e) => e !== 'bodyweight'), 'bodyweight']
    await db.profile.update('me', { equipment })
    await loadLibrary()
    // The plan must never prescribe gear you don't own — rebuild it now.
    const p = (await db.profile.get('me'))!
    await rebuildPendingDays(p)
    onChanged()
    notify('Equipment saved — your plan now only uses what you own')
  }

  async function addCustom() {
    if (!name.trim()) return
    const id = `custom-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`
    const def: ExerciseDef = {
      id,
      name: name.trim(),
      pattern,
      kind,
      equipment: gear.length ? gear : ['bodyweight'],
      custom: true,
      ...(kind === 'timed'
        ? { seconds: Number(seconds) || 45, met: 4 }
        : { repRange: [Number(repLo) || 8, Number(repHi) || 12] as [number, number] }),
      ...(kind === 'weighted' ? { startWeight: Number(startW) || 45, increment: 5 } : {}),
      ...(kind === 'bodyweight' ? { bwFactor: 0.5 } : {}),
    }
    await db.customExercises.put(def)
    await loadLibrary()
    setBuilding(false)
    setName('')
    setGear([])
    onChanged()
    notify(`Added "${def.name}" to your library`)
  }

  async function removeCustom(id: string) {
    await db.customExercises.delete(id)
    await loadLibrary()
    onChanged()
    notify('Custom exercise removed')
  }

  return (
    <div className="card">
      <div style={{ fontWeight: 800, marginBottom: 6 }}>My equipment</div>
      <p className="tiny" style={{ marginBottom: 10 }}>
        Check what you own — it unlocks matching exercises for swaps and future workouts.
        Currently unlocked: <b>{unlocked} exercises</b>.
      </p>
      <div className="equip-grid">
        {TOGGLABLE.map((eq) => (
          <button key={eq} className={`equip-item ${selected.includes(eq) ? 'on' : ''}`} onClick={() => toggle(eq)}>
            <span className="equip-check">{selected.includes(eq) ? '✓' : ''}</span>
            {EQUIPMENT_LABELS[eq]}
          </button>
        ))}
      </div>
      <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={save}>Save equipment</button>

      <div className="divider" />
      <div style={{ fontWeight: 800, marginBottom: 6 }}>My custom exercises</div>
      {customs.map((c) => (
        <div className="row" key={c.id} style={{ padding: '6px 0' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
          <button className="btn btn-sm btn-danger" onClick={() => removeCustom(c.id)}>Remove</button>
        </div>
      ))}
      {customs.length === 0 && <p className="tiny">None yet.</p>}
      <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={() => setBuilding(true)}>
        ＋ Create an exercise
      </button>

      {building && (
        <Sheet title="New exercise" onClose={() => setBuilding(false)}>
            <div className="field">
              <label>Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Landmine Press" />
            </div>
            <div className="field">
              <label>Type</label>
              <div className="seg">
                <button className={kind === 'weighted' ? 'on' : ''} onClick={() => setKind('weighted')}>Weighted</button>
                <button className={kind === 'bodyweight' ? 'on' : ''} onClick={() => setKind('bodyweight')}>Bodyweight</button>
                <button className={kind === 'timed' ? 'on' : ''} onClick={() => setKind('timed')}>Timed</button>
              </div>
            </div>
            <div className="field">
              <label>Movement pattern (decides swap suggestions)</label>
              <select className="input" value={pattern} onChange={(e) => setPattern(e.target.value as MovementPattern)}>
                {PATTERNS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Equipment it needs (from your gear)</label>
              <div className="equip-grid">
                {selected.filter((eq) => eq !== 'sauna').map((eq) => (
                  <button
                    key={eq}
                    className={`equip-item ${gear.includes(eq) ? 'on' : ''}`}
                    onClick={() => setGear((g) => (g.includes(eq) ? g.filter((x) => x !== eq) : [...g, eq]))}
                  >
                    <span className="equip-check">{gear.includes(eq) ? '✓' : ''}</span>
                    {EQUIPMENT_LABELS[eq]}
                  </button>
                ))}
              </div>
            </div>
            {kind !== 'timed' ? (
              <div className="field">
                <label>Rep range</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="set-input" inputMode="numeric" value={repLo} onChange={(e) => setRepLo(e.target.value)} />
                  <span className="muted">to</span>
                  <input className="set-input" inputMode="numeric" value={repHi} onChange={(e) => setRepHi(e.target.value)} />
                  <span className="unit-label">reps</span>
                </div>
              </div>
            ) : (
              <div className="field">
                <label>Hold time (seconds)</label>
                <input className="set-input" inputMode="numeric" value={seconds} onChange={(e) => setSeconds(e.target.value)} />
              </div>
            )}
            {kind === 'weighted' && (
              <div className="field">
                <label>Starting weight ({profile.unit})</label>
                <input className="set-input" inputMode="decimal" value={startW} onChange={(e) => setStartW(e.target.value)} />
              </div>
            )}
            <button className="btn btn-primary" onClick={addCustom} disabled={!name.trim()}>Add to library</button>
        </Sheet>
      )}
    </div>
  )
}
