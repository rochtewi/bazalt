import { useCallback, useEffect, useState } from 'react'
import { today } from '../db'
import { completeDay, getDay, pushDay, refreshTargets, skipDay, swapBlock } from '../engine/scheduler'
import { defFor, hasSauna, swapsFor } from '../data/library'
import { useToast } from '../components/useToast'
import TimerOverlay from '../components/TimerOverlay'
import type { Profile, ScheduledDay, WorkoutBlock } from '../types'

const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function prettyToday(): string {
  const d = new Date()
  return `${DOW[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export default function TodayScreen({ profile }: { profile: Profile }) {
  const [day, setDay] = useState<ScheduledDay | null>(null)
  const [swapIndex, setSwapIndex] = useState<number | null>(null)
  const [timerIndex, setTimerIndex] = useState<number | null>(null)
  const [toast, showToast] = useToast()

  const load = useCallback(async () => {
    let d = await getDay(today())
    // Targets are recomputed the day you train, so progression earned since
    // the day was generated always shows up.
    if (d) d = await refreshTargets(d)
    setDay(d ?? null)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!day) return <div className="screen" />

  const isRest = day.templateKey === 'rest'
  const pending = day.status === 'pending'

  function mutate(fn: (d: ScheduledDay) => ScheduledDay) {
    setDay((d) => (d ? fn(structuredClone(d)) : d))
  }

  function toggleSet(bi: number, si: number) {
    mutate((d) => {
      const block = d.blocks[bi]
      const set = block.sets[si]
      set.done = !set.done
      if (set.done) {
        // Quick-log: empty fields fall back to the planned targets.
        if (set.actualWeight == null && set.targetWeight != null) set.actualWeight = set.targetWeight
        if (set.actualReps == null && set.targetReps) set.actualReps = set.targetReps[1]
      }
      block.status = block.sets.every((s) => s.done) ? 'done' : 'pending'
      return d
    })
  }

  function setField(bi: number, si: number, field: 'actualReps' | 'actualWeight', value: string) {
    mutate((d) => {
      const n = value === '' ? undefined : Number(value)
      d.blocks[bi].sets[si][field] = Number.isFinite(n) ? n : undefined
      return d
    })
  }

  function setQuantity(bi: number, value: string) {
    mutate((d) => {
      const n = value === '' ? undefined : Number(value)
      d.blocks[bi].actualQuantity = Number.isFinite(n) ? n : undefined
      return d
    })
  }

  function toggleBlockSkip(bi: number) {
    mutate((d) => {
      const b = d.blocks[bi]
      b.status = b.status === 'skipped' ? 'pending' : 'skipped'
      return d
    })
  }

  function markBlockDone(bi: number) {
    mutate((d) => {
      const b = d.blocks[bi]
      const wasDone = b.status === 'done'
      for (const s of b.sets) {
        s.done = !wasDone
        if (s.done) {
          if (s.actualWeight == null && s.targetWeight != null) s.actualWeight = s.targetWeight
          if (s.actualReps == null && s.targetReps) s.actualReps = s.targetReps[1]
        }
      }
      if (b.kind === 'activity' && !wasDone && b.actualQuantity == null) b.actualQuantity = b.quantity
      b.status = wasDone ? 'pending' : 'done'
      return d
    })
  }

  async function onSwap(newId: string) {
    if (swapIndex == null || !day) return
    const updated = await swapBlock(day, swapIndex, newId)
    setDay(updated)
    setSwapIndex(null)
    showToast(`Swapped in ${defFor(newId).name}`)
  }

  async function onComplete() {
    if (!day) return
    const finished = structuredClone(day)
    // Anything untouched at completion time counts as skipped — no false progression.
    for (const b of finished.blocks) {
      if (b.status === 'pending') b.status = b.sets.some((s) => s.done) ? 'done' : 'skipped'
    }
    await completeDay(finished)
    await load()
    showToast(day.deload ? 'Deload logged.' : 'Logged. Next targets set.')
  }

  async function onPush() {
    await pushDay(today())
    await load()
    showToast('Pushed to tomorrow — schedule shifted.')
  }

  async function onSkip() {
    await skipDay(today())
    await load()
    showToast('Skipped. Tomorrow stays on plan.')
  }

  function onSauna() {
    mutate((d) => {
      d.saunaDone = !d.saunaDone
      return d
    })
  }

  const doneBlocks = day.blocks.filter((b) => b.status === 'done').length

  return (
    <div className="screen">
      <div className="screen-title">Today</div>
      <div className="screen-sub">{prettyToday()}</div>

      <div className="card-hero">
        <div className="eyebrow">{isRest ? 'Recovery' : day.custom ? 'Custom workout' : "Today's workout"}</div>
        <div className="hero-title">{day.title}</div>
        <div className="hero-sub">{day.focus}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {day.status === 'completed' && <span className="pill pill-green">✓ Completed</span>}
          {day.status === 'skipped' && <span className="pill pill-red">Skipped</span>}
          {pending && !isRest && <span className="pill pill-dim">{doneBlocks}/{day.blocks.length} exercises</span>}
          {day.deload && <span className="pill pill-dim">Deload week</span>}
          {day.sauna && hasSauna() && <span className="pill pill-accent">Sauna · {profile.saunaMinutes} min</span>}
        </div>
      </div>

      {!isRest &&
        day.blocks.map((block, bi) => (
          <BlockCard
            key={`${block.exerciseId}-${bi}`}
            block={block}
            unit={profile.unit}
            editable={pending}
            onToggleSet={(si) => toggleSet(bi, si)}
            onField={(si, f, v) => setField(bi, si, f, v)}
            onQuantity={(v) => setQuantity(bi, v)}
            onSkip={() => toggleBlockSkip(bi)}
            onAllDone={() => markBlockDone(bi)}
            onSwapReq={() => setSwapIndex(bi)}
            onTimer={() => setTimerIndex(bi)}
          />
        ))}

      {day.sauna && hasSauna() && (
        <div className="sauna-row">
          <button className={`set-check ${day.saunaDone ? 'on' : ''}`} onClick={onSauna} disabled={!pending}>
            {day.saunaDone ? '✓' : ''}
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Dry sauna — {profile.saunaMinutes} minutes</div>
            <div className="tiny">After training. Hydrate before and after.</div>
          </div>
        </div>
      )}

      {isRest && pending && (
        <div className="card">
          <div className="muted">
            Rest is where the growth happens. Walk, stretch, get sunlight. Tomorrow it's back to work.
          </div>
        </div>
      )}

      {pending && (
        <div style={{ marginTop: 16 }}>
          {!isRest ? (
            <button className="btn btn-primary" onClick={onComplete}>
              Finish workout ✓
            </button>
          ) : (
            <button className="btn btn-green" onClick={onComplete}>
              Mark rest day done
            </button>
          )}
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button className="btn btn-secondary" onClick={onPush}>Push to tomorrow →</button>
            {!isRest && (
              <button className="btn btn-danger" onClick={onSkip}>Skip today</button>
            )}
          </div>
        </div>
      )}

      {swapIndex != null && day.blocks[swapIndex] && (
        <div className="sheet-back" onClick={() => setSwapIndex(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title">Swap “{day.blocks[swapIndex].name}” for…</div>
            {swapsFor(day.blocks[swapIndex].exerciseId).map((alt) => (
              <button key={alt.id} className="swap-option" onClick={() => onSwap(alt.id)}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{alt.name}</div>
                {alt.cue && <div className="tiny" style={{ marginTop: 2 }}>{alt.cue}</div>}
              </button>
            ))}
            {swapsFor(day.blocks[swapIndex].exerciseId).length === 0 && (
              <div className="muted">No same-pattern alternative available with your equipment.</div>
            )}
          </div>
        </div>
      )}

      {timerIndex != null && day.blocks[timerIndex] && (
        <TimerOverlay
          block={day.blocks[timerIndex]}
          onDone={() => {
            markBlockDone(timerIndex)
            setTimerIndex(null)
          }}
          onClose={() => setTimerIndex(null)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function BlockCard({
  block,
  unit,
  editable,
  onToggleSet,
  onField,
  onQuantity,
  onSkip,
  onAllDone,
  onSwapReq,
  onTimer,
}: {
  block: WorkoutBlock
  unit: 'lb' | 'kg'
  editable: boolean
  onToggleSet: (si: number) => void
  onField: (si: number, field: 'actualReps' | 'actualWeight', value: string) => void
  onQuantity: (value: string) => void
  onSkip: () => void
  onAllDone: () => void
  onSwapReq: () => void
  onTimer: () => void
}) {
  const def = defFor(block.exerciseId)
  const skipped = block.status === 'skipped'
  const hasTimer = block.kind === 'timed' || block.kind === 'intervals'

  let targetLine = ''
  if (block.kind === 'intervals') {
    targetLine = `${block.rounds} rounds × ${block.workSeconds}s hard / ${block.restSeconds}s easy`
  } else if (block.kind === 'timed') {
    const s = block.seconds ?? 0
    targetLine = `${block.sets.length} × ${s >= 300 ? `${Math.round(s / 60)} min` : `${s}s`}`
  } else if (block.kind === 'activity') {
    targetLine = `${block.quantity ?? def.defaultQuantity} ${block.unit}`
  } else if (block.sets[0]?.targetReps) {
    const [lo, hi] = block.sets[0].targetReps
    const reps = lo === hi ? `${lo}` : `${lo}–${hi}`
    const w = block.sets[0].targetWeight != null ? ` @ ${block.sets[0].targetWeight} ${unit}` : ''
    targetLine = `${block.sets.length} × ${reps}${w}`
  }

  return (
    <div className={`block ${block.status === 'done' ? 'done' : ''} ${skipped ? 'skipped' : ''}`}>
      <div className="block-head">
        <div>
          <div className="block-name">
            {block.name} {block.status === 'done' && <span style={{ color: 'var(--green)' }}>✓</span>}
          </div>
          <div className="block-target">{targetLine}</div>
          {block.swappedFrom && <div className="tiny">swapped from {block.swappedFrom}</div>}
        </div>
        {editable && (
          <div className="block-actions">
            {hasTimer && <button className="btn btn-sm btn-secondary" onClick={onTimer}>⏱</button>}
            <button className="btn btn-sm btn-secondary" onClick={onSwapReq}>⇄</button>
            <button className="btn btn-sm btn-secondary" onClick={onSkip}>{skipped ? '↩' : '✕'}</button>
          </div>
        )}
      </div>

      {!skipped && (block.kind === 'weighted' || block.kind === 'bodyweight') && (
        <div>
          {block.sets.map((set, si) => (
            <div className="set-row" key={si}>
              <span className="set-label">SET {si + 1}</span>
              {block.kind === 'weighted' && (
                <>
                  <input
                    className="set-input"
                    inputMode="decimal"
                    placeholder={set.targetWeight != null ? String(set.targetWeight) : '—'}
                    value={set.actualWeight ?? ''}
                    onChange={(e) => onField(si, 'actualWeight', e.target.value)}
                    disabled={!editable}
                  />
                  <span className="unit-label">{unit}</span>
                </>
              )}
              <input
                className="set-input"
                inputMode="numeric"
                placeholder={
                  set.targetReps
                    ? set.targetReps[0] === set.targetReps[1]
                      ? String(set.targetReps[0])
                      : `${set.targetReps[0]}–${set.targetReps[1]}`
                    : '—'
                }
                value={set.actualReps ?? ''}
                onChange={(e) => onField(si, 'actualReps', e.target.value)}
                disabled={!editable}
              />
              <span className="unit-label">reps</span>
              <button className={`set-check ${set.done ? 'on' : ''}`} onClick={() => onToggleSet(si)} disabled={!editable}>
                {set.done ? '✓' : ''}
              </button>
            </div>
          ))}
          {block.sets.length > 4 && editable && (
            <button className="btn btn-sm btn-green" style={{ marginTop: 10 }} onClick={onAllDone}>
              {block.status === 'done' ? 'Undo all' : 'Mark all done ✓'}
            </button>
          )}
        </div>
      )}

      {!skipped && block.kind === 'activity' && (
        <div className="set-row">
          <input
            className="set-input"
            style={{ width: 96 }}
            inputMode="decimal"
            placeholder={String(block.quantity ?? def.defaultQuantity ?? '')}
            value={block.actualQuantity ?? ''}
            onChange={(e) => onQuantity(e.target.value)}
            disabled={!editable}
          />
          <span className="unit-label">{block.unit}</span>
          {editable && (
            <button className={`btn btn-sm ${block.status === 'done' ? 'btn-secondary' : 'btn-green'}`} onClick={onAllDone}>
              {block.status === 'done' ? 'Undo' : 'Mark done ✓'}
            </button>
          )}
        </div>
      )}

      {!skipped && (block.kind === 'timed' || block.kind === 'intervals') && editable && (
        <div className="btn-row" style={{ marginTop: 10 }}>
          <button className="btn btn-sm btn-secondary" onClick={onTimer}>⏱ Start timer</button>
          <button className="btn btn-sm btn-green" onClick={onAllDone}>
            {block.status === 'done' ? 'Undo' : 'Mark done ✓'}
          </button>
        </div>
      )}

      {!skipped && def?.cue && <div className="block-cue">{def.cue}</div>}
    </div>
  )
}
