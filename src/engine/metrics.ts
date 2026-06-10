import { db, addDays, today, weekStart } from '../db'
import { defFor } from '../data/library'
import type { Profile, ScheduledDay, WorkoutBlock } from '../types'

/**
 * Calorie and tonnage estimators. Calories use standard MET math
 * (kcal = MET x kg x hours) with per-exercise METs and durations estimated
 * from the logged work — honest trend numbers, not lab measurements.
 */

const LB_PER_KG = 2.20462
// kcal per pound of body weight per mile, by activity id (gross estimates).
const KCAL_PER_LB_MILE: Record<string, number> = { run: 0.75, walk: 0.53, ruck: 0.85 }
const MINUTES_PER_STRENGTH_SET = 2.5 // work + rest
const STRENGTH_MET = 4.5
const SAUNA_MET = 1.5

function toKg(weight: number, unit: 'lb' | 'kg'): number {
  return unit === 'lb' ? weight / LB_PER_KG : weight
}

function toLb(weight: number, unit: 'lb' | 'kg'): number {
  return unit === 'lb' ? weight : weight * LB_PER_KG
}

function blockCalories(block: WorkoutBlock, kg: number, lb: number): number {
  if (block.status !== 'done') return 0
  const def = defFor(block.exerciseId)
  if (block.kind === 'activity') {
    const qty = block.actualQuantity ?? block.quantity ?? 0
    if (block.unit === 'miles') return (KCAL_PER_LB_MILE[block.exerciseId] ?? 0.6) * lb * qty
    return (def.met ?? 4) * kg * (qty / 60)
  }
  if (block.kind === 'intervals') {
    const seconds = (block.rounds ?? 6) * ((block.workSeconds ?? 20) + (block.restSeconds ?? 100))
    return (def.met ?? 10) * kg * (seconds / 3600)
  }
  if (block.kind === 'timed') {
    const seconds = (block.seconds ?? 45) * Math.max(1, block.sets.filter((s) => s.done).length)
    return (def.met ?? 4) * kg * (seconds / 3600)
  }
  const doneSets = block.sets.filter((s) => s.done).length
  return STRENGTH_MET * kg * ((doneSets * MINUTES_PER_STRENGTH_SET) / 60)
}

/** Estimated calories for a completed day, including the sauna session. */
export function dayCalories(day: ScheduledDay, bodyWeight: number, unit: 'lb' | 'kg', saunaMinutes: number): number {
  if (day.status !== 'completed') return 0
  const kg = toKg(bodyWeight, unit)
  const lb = toLb(bodyWeight, unit)
  let kcal = 0
  for (const b of day.blocks) kcal += blockCalories(b, kg, lb)
  if (day.saunaDone) kcal += SAUNA_MET * kg * (saunaMinutes / 60)
  return Math.round(kcal)
}

/** Total weight moved (user units): logged weight x reps; bodyweight moves use bwFactor x body weight. */
export function dayVolume(day: ScheduledDay, bodyWeight: number): number {
  if (day.status !== 'completed') return 0
  let total = 0
  for (const b of day.blocks) {
    if (b.status !== 'done') continue
    const def = defFor(b.exerciseId)
    for (const s of b.sets) {
      if (!s.done) continue
      const reps = s.actualReps ?? 0
      if (b.kind === 'weighted') total += (s.actualWeight ?? 0) * reps
      else if (b.kind === 'bodyweight') total += (def.bwFactor ?? 0.5) * bodyWeight * reps
    }
  }
  return Math.round(total)
}

export interface DayMetric {
  date: string
  value: number
}

export interface MetricSummary {
  thisWeek: number
  lastWeek: number
  past30: number
  lifetime: number
  weekly: { label: string; value: number }[] // last 12 weeks, oldest first
}

export function summarize(points: DayMetric[]): MetricSummary {
  const t = today()
  const wkStart = weekStart(t)
  const lastWkStart = addDays(wkStart, -7)
  const day30 = addDays(t, -29)

  let thisWeek = 0
  let lastWeek = 0
  let past30 = 0
  let lifetime = 0
  const byWeek = new Map<string, number>()
  for (const p of points) {
    lifetime += p.value
    if (p.date >= wkStart) thisWeek += p.value
    else if (p.date >= lastWkStart) lastWeek += p.value
    if (p.date >= day30) past30 += p.value
    const wk = weekStart(p.date)
    byWeek.set(wk, (byWeek.get(wk) ?? 0) + p.value)
  }
  const weekly: { label: string; value: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const wk = addDays(wkStart, -7 * i)
    weekly.push({ label: `${Number(wk.slice(5, 7))}/${Number(wk.slice(8))}`, value: Math.round(byWeek.get(wk) ?? 0) })
  }
  return {
    thisWeek: Math.round(thisWeek),
    lastWeek: Math.round(lastWeek),
    past30: Math.round(past30),
    lifetime: Math.round(lifetime),
    weekly,
  }
}

export interface AllMetrics {
  calories: DayMetric[]
  volume: DayMetric[]
  workouts: DayMetric[]
  sauna: DayMetric[]
  streak: number
  longestStreak: number
  completed: number
  skipped: number
}

/** Body weight (user units) in effect on a given date: latest entry on or before it. */
function weightOn(date: string, sorted: { date: string; weight: number }[], fallback: number): number {
  let w = fallback
  for (const m of sorted) {
    if (m.date <= date) w = m.weight
    else break
  }
  return w
}

export async function getAllMetrics(profile: Profile): Promise<AllMetrics> {
  const done = await db.schedule.where('status').equals('completed').sortBy('date')
  const past = await db.schedule.where('date').belowOrEqual(today()).sortBy('date')
  const weights = await db.metrics.orderBy('date').toArray()
  const fallbackWeight = weights.length ? weights[weights.length - 1].weight : profile.unit === 'lb' ? 180 : 82

  const calories: DayMetric[] = []
  const volume: DayMetric[] = []
  const workouts: DayMetric[] = []
  const sauna: DayMetric[] = []
  for (const day of done) {
    const bw = weightOn(day.date, weights, fallbackWeight)
    calories.push({ date: day.date, value: dayCalories(day, bw, profile.unit, profile.saunaMinutes) })
    volume.push({ date: day.date, value: dayVolume(day, bw) })
    if (day.templateKey !== 'rest') workouts.push({ date: day.date, value: 1 })
    if (day.saunaDone) sauna.push({ date: day.date, value: 1 })
  }

  // Streaks: consecutive completed training days, rest days neutral.
  let streak = 0
  for (let i = past.length - 1; i >= 0; i--) {
    const d = past[i]
    if (d.templateKey === 'rest') continue
    if (d.status === 'completed') streak++
    else if (d.date !== today()) break
    else if (d.status === 'skipped') break
  }
  let longestStreak = 0
  let run = 0
  for (const d of past) {
    if (d.templateKey === 'rest') continue
    if (d.status === 'completed') {
      run++
      longestStreak = Math.max(longestStreak, run)
    } else if (d.status === 'skipped') run = 0
  }

  return {
    calories,
    volume,
    workouts,
    sauna,
    streak,
    longestStreak: Math.max(longestStreak, streak),
    completed: done.filter((d) => d.templateKey !== 'rest').length,
    skipped: past.filter((d) => d.status === 'skipped').length,
  }
}
