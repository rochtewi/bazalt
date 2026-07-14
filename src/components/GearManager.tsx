import { useState } from 'react'
import { db } from '../db'
import { owned } from '../data/library'
import { achievableBarbellLoads, DEFAULT_GEAR, initGear } from '../engine/loads'
import { rebuildPendingDays } from '../engine/scheduler'
import type { Gear, Profile } from '../types'

const PLATE_SIZES_LB = [55, 45, 35, 25, 10, 5, 2.5]
const PLATE_SIZES_KG = [25, 20, 15, 10, 5, 2.5, 1.25]

/**
 * Weight inventory editor. Whatever is saved here becomes the universe of
 * loads the program is allowed to prescribe — targets snap to real plates.
 */
export default function GearManager({ profile, onChanged, notify }: {
  profile: Profile
  onChanged: () => void
  notify: (msg: string) => void
}) {
  const [gear, setGear] = useState<Gear>(profile.gear ?? DEFAULT_GEAR)
  const [dbInput, setDbInput] = useState('')
  const [kbInput, setKbInput] = useState('')
  const unit = profile.unit
  const sizes = unit === 'kg' ? PLATE_SIZES_KG : PLATE_SIZES_LB

  const loads = achievableBarbellLoads(gear.barWeight, gear.platePairs)
  const hasEz = owned().includes('ez-bar')
  const hasDb = owned().includes('dumbbells')
  const hasKb = owned().includes('kettlebell')

  function setPairs(size: number, delta: number) {
    setGear((g) => {
      const key = String(size)
      const next = Math.max(0, (g.platePairs[key] ?? 0) + delta)
      return { ...g, platePairs: { ...g.platePairs, [key]: next } }
    })
  }

  function addWeight(list: 'dumbbells' | 'kettlebells', raw: string, clear: () => void) {
    const w = Number(raw)
    if (!Number.isFinite(w) || w <= 0) return
    setGear((g) => ({ ...g, [list]: [...new Set([...g[list], w])].sort((a, b) => a - b) }))
    clear()
  }

  function removeWeight(list: 'dumbbells' | 'kettlebells', w: number) {
    setGear((g) => ({ ...g, [list]: g[list].filter((x) => x !== w) }))
  }

  async function save() {
    await db.profile.update('me', { gear })
    initGear(gear)
    const p = (await db.profile.get('me'))!
    await rebuildPendingDays(p)
    onChanged()
    notify('Gear saved — every target now uses plates you own')
  }

  return (
    <div className="card">
      <div style={{ fontWeight: 800, marginBottom: 6 }}>Weights you own</div>
      <p className="tiny" style={{ marginBottom: 12 }}>
        The program only prescribes weights you can actually build from this inventory — no impossible plate math.
      </p>

      <div className="field">
        <label>Barbell weight ({unit})</label>
        <input
          className="set-input"
          inputMode="decimal"
          value={gear.barWeight}
          onChange={(e) => setGear((g) => ({ ...g, barWeight: Number(e.target.value) || 0 }))}
        />
      </div>
      {hasEz && (
        <div className="field">
          <label>EZ / specialty bar weight ({unit})</label>
          <input
            className="set-input"
            inputMode="decimal"
            value={gear.ezBarWeight}
            onChange={(e) => setGear((g) => ({ ...g, ezBarWeight: Number(e.target.value) || 0 }))}
          />
        </div>
      )}

      <div className="field">
        <label>Plates (pairs owned)</label>
        {sizes.map((s) => {
          const count = gear.platePairs[String(s)] ?? 0
          return (
            <div className="row" key={s} style={{ padding: '5px 0' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{s} {unit}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <button className="btn btn-sm btn-secondary" onClick={() => setPairs(s, -1)} disabled={count === 0}>−</button>
                <span style={{ minWidth: 52, textAlign: 'center', fontWeight: 700 }}>{count} pair{count === 1 ? '' : 's'}</span>
                <button className="btn btn-sm btn-secondary" onClick={() => setPairs(s, 1)}>＋</button>
              </span>
            </div>
          )
        })}
        <p className="tiny" style={{ marginTop: 6 }}>
          {loads.length > 1
            ? `Buildable barbell loads: ${loads.length} steps, ${loads[0]} to ${loads[loads.length - 1]} ${unit}.`
            : 'Add plates to unlock barbell loads.'}
        </p>
      </div>

      {hasDb && (
        <div className="field">
          <label>Dumbbells (per-hand weights)</label>
          <WeightChips list={gear.dumbbells} unit={unit} onRemove={(w) => removeWeight('dumbbells', w)} />
          <div className="row" style={{ marginTop: 6 }}>
            <input className="set-input" inputMode="decimal" placeholder="e.g. 30" value={dbInput} onChange={(e) => setDbInput(e.target.value)} />
            <button className="btn btn-sm btn-secondary" onClick={() => addWeight('dumbbells', dbInput, () => setDbInput(''))}>Add</button>
          </div>
        </div>
      )}
      {hasKb && (
        <div className="field">
          <label>Kettlebells</label>
          <WeightChips list={gear.kettlebells} unit={unit} onRemove={(w) => removeWeight('kettlebells', w)} />
          <div className="row" style={{ marginTop: 6 }}>
            <input className="set-input" inputMode="decimal" placeholder="e.g. 35" value={kbInput} onChange={(e) => setKbInput(e.target.value)} />
            <button className="btn btn-sm btn-secondary" onClick={() => addWeight('kettlebells', kbInput, () => setKbInput(''))}>Add</button>
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={save}>Save gear</button>
    </div>
  )
}

function WeightChips({ list, unit, onRemove }: { list: number[]; unit: string; onRemove: (w: number) => void }) {
  if (list.length === 0) return <p className="tiny">None added yet.</p>
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {list.map((w) => (
        <button key={w} className="pill pill-dim" onClick={() => onRemove(w)}>
          {w} {unit} ✕
        </button>
      ))}
    </div>
  )
}
