import { db, addDays, getMeta, setMeta, today } from '../db'
import { defFor, templateForIndex, type DayTemplate } from './program'
import { advance, buildSets, freshState } from './progression'
import type { Profile, ScheduledDay, WorkoutBlock } from '../types'

const HORIZON_DAYS = 28

async function stateFor(exerciseId: string) {
  const existing = await db.exerciseState.get(exerciseId)
  if (existing) return existing
  const fresh = freshState(defFor(exerciseId))
  await db.exerciseState.put(fresh)
  return fresh
}

async function materializeDay(date: string, template: DayTemplate): Promise<ScheduledDay> {
  const blocks: WorkoutBlock[] = []
  for (const ex of template.exercises) {
    const def = defFor(ex.id)
    const state = await stateFor(ex.id)
    blocks.push({
      exerciseId: def.id,
      name: def.name,
      kind: def.kind,
      status: 'pending',
      sets: buildSets(def, state, ex.sets),
      seconds: state.seconds ?? def.seconds,
      rounds: state.rounds ?? def.rounds,
      workSeconds: def.workSeconds,
      restSeconds: def.restSeconds,
    })
  }
  return {
    date,
    templateKey: template.key,
    title: template.title,
    focus: template.focus,
    status: 'pending',
    sauna: template.sauna,
    saunaDone: false,
    blocks,
  }
}

/**
 * Ensure the schedule is materialized from today through the horizon.
 * Each generated day consumes the next index in the program rotation;
 * pushes simply shift materialized rows forward, stretching the cycle.
 */
export async function ensureSchedule(profile: Profile): Promise<void> {
  const cursorRaw = await getMeta('programCursor')
  let cursor = cursorRaw ? parseInt(cursorRaw, 10) : 0

  const last = await db.schedule.orderBy('date').last()
  let nextDate = last ? addDays(last.date, 1) : today()
  const end = addDays(today(), HORIZON_DAYS)

  const rows: ScheduledDay[] = []
  while (nextDate <= end) {
    rows.push(await materializeDay(nextDate, templateForIndex(cursor, profile.daysPerWeek)))
    cursor++
    nextDate = addDays(nextDate, 1)
  }
  if (rows.length) {
    await db.schedule.bulkAdd(rows)
    await setMeta('programCursor', String(cursor))
  }
}

export async function getDay(date: string): Promise<ScheduledDay | undefined> {
  return db.schedule.where('date').equals(date).first()
}

export async function getRange(from: string, to: string): Promise<ScheduledDay[]> {
  return db.schedule.where('date').between(from, to, true, true).sortBy('date')
}

/**
 * Push today's workout to tomorrow: every pending day from this date forward
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
 * Skipped blocks don't advance — the next session keeps the same targets.
 */
export async function completeDay(day: ScheduledDay): Promise<void> {
  await db.schedule.update(day.id!, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    blocks: day.blocks,
    saunaDone: day.saunaDone,
  })
  for (const block of day.blocks) {
    if (block.status !== 'done') continue
    const def = defFor(block.exerciseId)
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
    sets: buildSets(def, state, setCount),
    seconds: state.seconds ?? def.seconds,
    rounds: state.rounds ?? def.rounds,
    workSeconds: def.workSeconds,
    restSeconds: def.restSeconds,
    swappedFrom: old.swappedFrom ?? old.name,
  }
  const updated = { ...day, blocks }
  await db.schedule.update(day.id!, { blocks })
  return updated
}

export interface Stats {
  completed: number
  skipped: number
  streak: number
  saunaSessions: number
}

export async function getStats(): Promise<Stats> {
  const past = await db.schedule.where('date').belowOrEqual(today()).sortBy('date')
  const completed = past.filter((d) => d.status === 'completed').length
  const skipped = past.filter((d) => d.status === 'skipped').length
  const saunaSessions = past.filter((d) => d.saunaDone).length
  // Streak: consecutive non-skipped training days counting back from today (rest days don't break it).
  let streak = 0
  for (let i = past.length - 1; i >= 0; i--) {
    const d = past[i]
    if (d.templateKey === 'rest') continue
    if (d.status === 'completed') streak++
    else if (d.status === 'skipped') break
    else if (d.date !== today()) break
  }
  return { completed, skipped, streak, saunaSessions }
}
