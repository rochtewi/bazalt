import { useCallback, useEffect, useState } from 'react'
import { db } from '../db'
import { availableExercises, defFor } from '../data/library'
import type { CustomWorkout, CustomWorkoutItem } from '../types'

function itemSummary(item: CustomWorkoutItem): string {
  const def = defFor(item.exerciseId)
  if (def.kind === 'activity') return `${item.quantity ?? def.defaultQuantity} ${def.unit}`
  if (def.kind === 'timed') return `${item.sets ?? 1} × ${item.seconds ?? def.seconds}s`
  if (def.kind === 'intervals') return 'intervals'
  return `${item.sets ?? 3} × ${item.reps ?? '8'}`
}

export default function WorkoutManager({ notify }: { notify: (msg: string) => void }) {
  const [workouts, setWorkouts] = useState<CustomWorkout[]>([])
  const [building, setBuilding] = useState(false)
  const [name, setName] = useState('')
  const [items, setItems] = useState<CustomWorkoutItem[]>([])
  const [picking, setPicking] = useState(false)

  const load = useCallback(async () => {
    setWorkouts(await db.customWorkouts.toArray())
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function addItem(exerciseId: string) {
    const def = defFor(exerciseId)
    const item: CustomWorkoutItem =
      def.kind === 'activity'
        ? { exerciseId, quantity: def.defaultQuantity }
        : def.kind === 'timed'
          ? { exerciseId, sets: 3, seconds: def.seconds }
          : def.kind === 'intervals'
            ? { exerciseId, sets: 1 }
            : { exerciseId, sets: 3, reps: def.repRange?.[1] ?? 10 }
    setItems((arr) => [...arr, item])
    setPicking(false)
  }

  function updateItem(i: number, patch: Partial<CustomWorkoutItem>) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }

  async function save() {
    if (!name.trim() || items.length === 0) return
    const focus = items.map(itemSummary).length <= 3
      ? items.map((it) => defFor(it.exerciseId).name).join(' · ')
      : `${items.length} movements`
    await db.customWorkouts.add({ name: name.trim(), focus, items })
    setName('')
    setItems([])
    setBuilding(false)
    await load()
    notify('Workout saved — place it from the Calendar')
  }

  async function remove(id: number) {
    await db.customWorkouts.delete(id)
    await load()
    notify('Workout deleted')
  }

  const groups = new Map<string, ReturnType<typeof availableExercises>>()
  for (const e of availableExercises()) {
    const key = e.pattern === 'activity' ? 'Activities (miles / minutes)' : e.pattern
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(e)
  }

  return (
    <div className="card">
      <div style={{ fontWeight: 800, marginBottom: 6 }}>My workouts</div>
      <p className="tiny" style={{ marginBottom: 10 }}>
        Build your own workouts (Murph is preloaded), then place them on any day from the Calendar tab.
      </p>
      {workouts.map((w) => (
        <div className="row" key={w.id} style={{ padding: '6px 0' }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{w.name}</span>
            {w.preset && <span className="tiny"> · preset</span>}
            <div className="tiny">{w.focus}</div>
          </div>
          <button className="btn btn-sm btn-danger" onClick={() => remove(w.id!)}>Delete</button>
        </div>
      ))}
      <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={() => setBuilding(true)}>
        ＋ Build a workout
      </button>

      {building && (
        <div className="sheet-back" onClick={() => setBuilding(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title">New workout</div>
            <div className="field">
              <label>Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Memorial Day Murph" />
            </div>

            {items.map((item, i) => {
              const def = defFor(item.exerciseId)
              return (
                <div className="block" key={i} style={{ marginTop: 8 }}>
                  <div className="row">
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{def.name}</span>
                    <button className="btn btn-sm btn-danger" onClick={() => setItems((arr) => arr.filter((_, idx) => idx !== i))}>✕</button>
                  </div>
                  <div className="set-row">
                    {def.kind === 'activity' ? (
                      <>
                        <input
                          className="set-input"
                          inputMode="decimal"
                          value={item.quantity ?? ''}
                          onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || undefined })}
                        />
                        <span className="unit-label">{def.unit}</span>
                      </>
                    ) : def.kind === 'timed' ? (
                      <>
                        <input className="set-input" inputMode="numeric" value={item.sets ?? 1} onChange={(e) => updateItem(i, { sets: Number(e.target.value) || 1 })} />
                        <span className="unit-label">sets ×</span>
                        <input className="set-input" inputMode="numeric" value={item.seconds ?? def.seconds ?? 45} onChange={(e) => updateItem(i, { seconds: Number(e.target.value) || undefined })} />
                        <span className="unit-label">sec</span>
                      </>
                    ) : def.kind === 'intervals' ? (
                      <span className="tiny">Uses your current interval targets</span>
                    ) : (
                      <>
                        <input className="set-input" inputMode="numeric" value={item.sets ?? 3} onChange={(e) => updateItem(i, { sets: Number(e.target.value) || 1 })} />
                        <span className="unit-label">sets ×</span>
                        <input className="set-input" inputMode="numeric" value={item.reps ?? ''} onChange={(e) => updateItem(i, { reps: Number(e.target.value) || undefined })} />
                        <span className="unit-label">reps</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => setPicking(true)}>
              ＋ Add movement
            </button>
            <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={save} disabled={!name.trim() || items.length === 0}>
              Save workout
            </button>

            {picking && (
              <div className="sheet-back" onClick={() => setPicking(false)}>
                <div className="sheet" onClick={(e) => e.stopPropagation()}>
                  <div className="sheet-title">Add a movement</div>
                  {[...groups.entries()].map(([pattern, list]) => (
                    <div key={pattern}>
                      <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', margin: '10px 0 6px' }}>{pattern.replace('-', ' ')}</div>
                      {list.map((e) => (
                        <button key={e.id} className="swap-option" onClick={() => addItem(e.id)}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
