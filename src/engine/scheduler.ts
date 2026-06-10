import { db, addDays, getMeta, setMeta, today } from '../db'
import { templateForIndex, type DayTemplate } from './program'
import { defFor } from '../data/library'
import { advance, buildSets, freshState } from './progression'
import type { CustomWorkout, Profile, ScheduledDay, WorkoutBlock } from '../types'

const HORIZON_DAYS = 28
const DELOAD_EVERY_N_WEEKS = 6

async function stateFor(exerciseId: string) {
  const existing = await db.exerciseState.get(exerciseId)
  if (existing) return existing
  const fresh = freshState(defFor(exerciseId))
  await db.exerciseState.put(fresh)
  return fresh
}

function isDeloadWeek(dayCursor: number): boolean {
  const weekIndex = Math.floor(dayCursor / 7)
  return weekIndex % DELOAD_EVERY_N_WEEKS === DELOAD_EVERY_N_WEEKS - 1
}

async function materializeDay(date: string, template: DayTemplate, deload: boolean): Promise<ScheduledDay> {
  const blocks: WorkoutBlock[] = []
  for (const ex of template.exercises) {
    const def = defFor(ex.id)
    const state = await stateFor(ex.id)
    const setCount = deload ? Math.max(2, ex.sets - 1) : ex.sets
    blocks.push({
      exerciseId: def.id,
      name: def.name,
      kind: def.kind,
      status: 'pending',
      sets: buildSets(def, state, setCount, { deload }),
      seconds: state.seconds ?? def.seconds,
      rounds: deload ? Math.max(3, (state.rounds ?? def.rounds ?? 6) - 2) : (state.rounds ?? def.rounds),
      workSeconds: def.workSeconds,
      restSeconds: def.restSeconds,
    })
  }
  return {
    date,
    templateKey: template.key,
    title: deload && template.key !== 'rest' ? `${template.title} · Deload` : template.title,
    focus: deload && template.key !== 'rest' ? `${template.focus} — lighter week, recover hard` : template.focus,
    status: 'pending',
    sauna: template.sauna,
    saunaDone: false,
    blocks,
    deload: deload && template.key !== 'rest' ? true : undefined,
  }
}

/**
 * Ensure the schedule is materialized from today through the horizon.
 * Each generated day consumes the next index in the program rotation;
 * pushes simply shift materialized rows forward, stretching the cycle.
 * Every 6th program week is a deload: one set fewer and ~85% loads.
 */
export async function ensureSchedule(profile: Profile): Promise<void> {
  const cursorRaw = await getMeta('programCursor')
  let cursor = cursorRaw ? parseInt(cursorRaw, 10) : 0

  const last = await db.schedule.orderBy('date').last()
  let nextDate = last ? addDays(last.date, 1) : today()
  const end = addDays(today(), HORIZON_DAYS)

  const rows: ScheduledDay[] = []
  while (nextDate <= end) {
    rows.push(await materializeDay(nextDate, templateForIndex(cursor, profile.daysPerWeek), isDeloadWeek(cursor)))
    cursor++
    nextDate = addDays(nextDate, 1)
  }
  if (rows.length) {
    await db.schedule.bulkAdd(rows)
    await setMeta('programCursor', String(cursor))
  }
}

/**
 * Recompute a pending, untouched day's targets from the latest progression
 * state, so progress earned since the day was generated shows up immediately.
 */
export async function refreshTargets(day: ScheduledDay): Promise<ScheduledDay> {
  if (day.status !== 'pending' || day.custom) return day
  const untouched = day.blocks.every(
    (b) => b.status === 'pending' && b.sets.every((s) => !s.done && s.actualReps == null && s.actualWeight == null),
  )
  if (!untouched) return day

  const blocks: WorkoutBlock[] = []
  for (const b of day.blocks) {
    const def = defFor(b.exerciseId)
    const state = await stateFor(b.exerciseId)
    blocks.push({
      ...b,
      sets: buildSets(def, state, b.sets.length, { deload: day.deload }),
      seconds: state.seconds ?? def.seconds,
      rounds: b.rounds != null ? (day.deload ? b.rounds : (state.rounds ?? def.rounds)) : undefined,
    })
  }
  const updated = { ...day, blocks }
  await db.schedule.update(day.id!, { blocks })
  return updated
}

export async function getDay(date: string): Promise<ScheduledDay | undefined> {
  return db.schedule.where('date').equals(date).first()
}

export async function getRange(from: string, to: string): Promise<ScheduledDay[]> {
  return db.schedule.where('date').between(from, to, true, true).sortBy('date')
}

/**
 * Push a day's workout to tomorrow: every pending day from this date forward
 * shifts one day later, preserving order and rest spacing.
 */
export async function pushDay(date: string): Promise<void> {
  const all = await db.schedule.where('date').aboveOrEqual(date).sortBy('date')
  const toShift = all.filter((d) => d.status === 'pending')
  // Shift from the latest date backwards so the unique date index never collides.
  for (const d of toShift.reverse()) {
    await db.schedule.update(d.id!, { date: addDays(d.date, 1) })
  }
}

/** Skip: mark the day skipped; the rest of the schedule stays put. */
export async function skipDay(date: string): Promise<void> {
  const d = await getDay(date)
  if (d?.id) await db.schedule.update(d.id, { status: 'skipped' })
}

/**
 * Complete: persist logs, advance progression for every finished block.
 * Skipped blocks don't advance, and deload days never raise targets.
 */
export async function completeDay(day: ScheduledDay): Promise<void> {
  await db.schedule.update(day.id!, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    blocks: day.blocks,
    saunaDone: day.saunaDone,
  })
  if (day.deload) return
  for (const block of day.blocks) {
    if (block.status !== 'done') continue
    const def = defFor(block.exerciseId)
    if (def.kind === 'activity') continue
    const state = await stateFor(block.exerciseId)
    await db.exerciseState.put(advance(def, state, block))
  }
}

/** Replace one block with a same-pattern alternative, fresh targets included. */
export async function swapBlock(day: ScheduledDay, blockIndex: number, newExerciseId: string): Promise<ScheduledDay> {
  const def = defFor(newExerciseId)
  const state = await stateFor(newExerciseId)
  const old = day.blocks[blockIndex]
  const setCount = Math.max(old.sets.length, 1)
  const blocks = [...day.blocks]
  blocks[blockIndex] = {
    exerciseId: def.id,
    name: def.name,
    kind: def.kind,
    status: 'pending',
    sets: def.kind === 'activity' ? [] : buildSets(def, state, setCount, { deload: day.deload }),
    seconds: state.seconds ?? def.seconds,
    rounds: state.rounds ?? def.rounds,
    workSeconds: def.workSeconds,
    restSeconds: def.restSeconds,
    unit: def.unit,
    quantity: def.defaultQuantity,
    swappedFrom: old.swappedFrom ?? old.name,
  }
  const updated = { ...day, blocks }
  await db.schedule.update(day.id!, { blocks })
  return updated
}

/** Build the blocks for a custom workout from its items. */
async function customBlocks(workout: CustomWorkout): Promise<WorkoutBlock[]> {
  const blocks: WorkoutBlock[] = []
  for (const item of workout.items) {
    const def = defFor(item.exerciseId)
    const state = await stateFor(item.exerciseId)
    const base = {
      exerciseId: def.id,
      name: def.name,
      kind: def.kind,
      status: 'pending' as const,
    }
    if (def.kind === 'activity') {
      blocks.push({ ...base, sets: [], unit: def.unit, quantity: item.quantity ?? def.defaultQuantity })
    } else if (def.kind === 'timed') {
      blocks.push({
        ...base,
        sets: Array.from({ length: item.sets ?? 1 }, () => ({ targetReps: null, targetWeight: null, done: false })),
        seconds: item.seconds ?? state.seconds ?? def.seconds,
      })
    } else if (def.kind === 'intervals') {
      blocks.push({
        ...base,
        sets: [{ targetReps: null, targetWeight: null, done: false }],
        rounds: state.rounds ?? def.rounds,
        workSeconds: def.workSeconds,
        restSeconds: def.restSeconds,
      })
    } else {
      blocks.push({
        ...base,
        sets: buildSets(def, state, item.sets ?? 3, { fixedReps: item.reps }),
      })
    }
  }
  return blocks
}

/**
 * Place a custom workout on a date. 'insert' shifts the existing pending
 * schedule one day later; 'replace' overwrites that day's planned workout.
 */
export async function placeCustomWorkout(
  date: string,
  workout: CustomWorkout,
  mode: 'insert' | 'replace',
): Promise<void> {
  const blocks = await customBlocks(workout)
  const existing = await getDay(date)
  if (mode === 'insert') {
    await pushDay(date)
    await db.schedule.add({
      date,
      templateKey: 'custom',
      title: workout.name,
      focus: workout.focus,
      status: 'pending',
      sauna: false,
      saunaDone: false,
      blocks,
      custom: true,
    })
  } else {
    if (!existing?.id) throw new Error('No scheduled day to replace.')
    await db.schedule.update(existing.id, {
      templateKey: 'custom',
      title: workout.name,
      focus: workout.focus,
      blocks,
      custom: true,
      deload: undefined,
      status: 'pending',
    })
  }
}
