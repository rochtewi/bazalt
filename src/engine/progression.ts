import { nextLoadUp, snapLoad } from './loads'
import type { ExerciseDef, ExerciseState, SetEntry, WorkoutBlock } from '../types'

/**
 * Double progression for weighted lifts: work within the rep range at a fixed
 * weight; once every set hits the top of the range, step up to the next load
 * actually buildable from the owned plates/bells (see loads.ts).
 * Bodyweight: chase reps. Intervals: add a round every other completion (cap 10).
 * Timed: add 15s every other completion (cap 120s for holds).
 */

export function freshState(def: ExerciseDef): ExerciseState {
  return {
    exerciseId: def.id,
    weight: def.kind === 'weighted' ? (def.startWeight ?? null) : null,
    bestReps: null,
    rounds: def.rounds ?? null,
    seconds: def.seconds ?? null,
    timesCompleted: 0,
    updatedAt: new Date().toISOString(),
  }
}

/** Build the target sets for a block from current progression state. */
export function buildSets(
  def: ExerciseDef,
  state: ExerciseState,
  setCount: number,
  opts: { deload?: boolean; fixedReps?: number } = {},
): SetEntry[] {
  let weight = def.kind === 'weighted' ? state.weight : null
  if (weight != null) weight = snapLoad(def, opts.deload ? weight * 0.85 : weight)
  const reps: [number, number] | null = opts.fixedReps
    ? [opts.fixedReps, opts.fixedReps]
    : (def.repRange ?? null)
  const sets: SetEntry[] = []
  for (let i = 0; i < setCount; i++) {
    sets.push({ targetReps: reps, targetWeight: weight, done: false })
  }
  return sets
}

/** Human-readable one-liner of what was just logged, shown as "last time". */
function summarize(def: ExerciseDef, block: WorkoutBlock): string | undefined {
  const doneSets = block.sets.filter((s) => s.done)
  if (def.kind === 'weighted' && doneSets.length) {
    const reps = doneSets.map((s) => s.actualReps ?? 0)
    const w = Math.max(...doneSets.map((s) => s.actualWeight ?? 0))
    const lo = Math.min(...reps)
    const hi = Math.max(...reps)
    return `${doneSets.length} × ${lo === hi ? lo : `${lo}–${hi}`}${w ? ` @ ${w}` : ''}`
  }
  if (def.kind === 'bodyweight' && doneSets.length) {
    const best = Math.max(0, ...doneSets.map((s) => s.actualReps ?? 0))
    return best > 0 ? `${doneSets.length} sets, best ${best}` : `${doneSets.length} sets`
  }
  if (def.kind === 'timed') return `${block.sets.length} × ${block.seconds ?? def.seconds ?? 0}s`
  if (def.kind === 'intervals') return `${block.rounds ?? def.rounds ?? 0} rounds`
  return undefined
}

/** After a completed block, compute the next state. */
export function advance(def: ExerciseDef, state: ExerciseState, block: WorkoutBlock): ExerciseState {
  const next: ExerciseState = { ...state, timesCompleted: state.timesCompleted + 1, updatedAt: new Date().toISOString() }
  const doneSets = block.sets.filter((s) => s.done)
  next.lastSummary = summarize(def, block) ?? state.lastSummary

  if (def.kind === 'weighted' && def.repRange) {
    const top = def.repRange[1]
    const allAtTop = doneSets.length === block.sets.length && doneSets.every((s) => (s.actualReps ?? 0) >= top)
    const usedWeight = doneSets.length ? Math.max(...doneSets.map((s) => s.actualWeight ?? state.weight ?? 0)) : state.weight
    next.weight = usedWeight ?? state.weight
    if (allAtTop && next.weight != null) next.weight = nextLoadUp(def, next.weight)
  } else if (def.kind === 'bodyweight') {
    const best = Math.max(0, ...doneSets.map((s) => s.actualReps ?? 0))
    if (best > 0) next.bestReps = Math.max(state.bestReps ?? 0, best)
  } else if (def.kind === 'intervals') {
    if (next.timesCompleted % 2 === 0) next.rounds = Math.min((state.rounds ?? def.rounds ?? 6) + 1, 10)
  } else if (def.kind === 'timed' && def.seconds && def.seconds <= 120) {
    if (next.timesCompleted % 2 === 0) next.seconds = Math.min((state.seconds ?? def.seconds) + 15, 120)
  }
  return next
}

/** One-line target description shown in the workout card. */
export function targetLabel(def: ExerciseDef, state: ExerciseState, unit: 'lb' | 'kg'): string {
  if (def.kind === 'weighted' && def.repRange) {
    const w = state.weight != null ? ` @ ${state.weight} ${unit}` : ''
    return `${def.repRange[0]}–${def.repRange[1]} reps${w}`
  }
  if (def.kind === 'bodyweight' && def.repRange) {
    const pb = state.bestReps ? ` (best: ${state.bestReps})` : ''
    return `${def.repRange[0]}–${def.repRange[1]} reps${pb}`
  }
  if (def.kind === 'intervals') {
    return `${state.rounds ?? def.rounds} × ${def.workSeconds}s on / ${def.restSeconds}s easy`
  }
  if (def.kind === 'timed') {
    const s = state.seconds ?? def.seconds ?? 0
    return s >= 300 ? `${Math.round(s / 60)} min` : `${s}s hold`
  }
  return ''
}
