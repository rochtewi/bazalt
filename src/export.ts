import { db, addDays, today } from './db'
import { dayCalories, dayVolume } from './engine/metrics'
import type { BodyMetric, Profile, ScheduledDay } from './types'

/**
 * CSV export for Excel / Sheets. Two shapes:
 *  - workout log: one row per set (or per activity)
 *  - daily summary: one row per day with volume, calories, sauna, body weight
 * Health events join the daily summary once the Health tab ships.
 */

export type ExportRange = 30 | 90 | 'all'

function csvCell(v: string | number | null | undefined): string {
  if (v == null) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCSV(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
}

async function daysInRange(range: ExportRange): Promise<ScheduledDay[]> {
  const to = today()
  if (range === 'all') {
    const all = await db.schedule.orderBy('date').toArray()
    return all.filter((d) => d.date <= to)
  }
  const from = addDays(to, -range)
  return db.schedule.where('date').between(from, to, true, true).sortBy('date')
}

export async function buildWorkoutCSV(range: ExportRange, unit: string): Promise<string> {
  const days = await daysInRange(range)
  const rows: (string | number | null | undefined)[][] = [[
    'Date', 'Workout', 'Day Status', 'Exercise', 'Kind', 'Set', 'Target Reps', 'Actual Reps',
    `Weight (${unit})`, 'Quantity', 'Unit', 'Block Status',
  ]]
  for (const d of days) {
    for (const b of d.blocks) {
      if (b.kind === 'activity') {
        rows.push([d.date, d.title, d.status, b.name, b.kind, '', '', '', '', b.actualQuantity ?? b.quantity, b.unit, b.status])
        continue
      }
      if (b.kind === 'timed' || b.kind === 'intervals') {
        const desc = b.kind === 'timed' ? `${b.sets.length} × ${b.seconds ?? ''}s` : `${b.rounds ?? ''} rounds`
        rows.push([d.date, d.title, d.status, b.name, b.kind, '', '', '', '', desc, '', b.status])
        continue
      }
      b.sets.forEach((s, i) => {
        rows.push([
          d.date, d.title, d.status, b.name, b.kind, i + 1,
          s.targetReps ? `${s.targetReps[0]}-${s.targetReps[1]}` : '',
          s.actualReps ?? '', s.actualWeight ?? '', '', '', s.done ? 'done' : b.status,
        ])
      })
    }
  }
  return toCSV(rows)
}

export async function buildDailySummaryCSV(range: ExportRange, profile: Profile): Promise<string> {
  const unit = profile.unit
  const days = await daysInRange(range)
  const weights: BodyMetric[] = await db.metrics.orderBy('date').toArray()
  const weightByDate = new Map(weights.map((w) => [w.date, w.weight]))
  // Nearest prior weigh-in feeds volume/calorie math, same as the app does.
  let latestWeight = weights.length ? weights[weights.length - 1].weight : 180

  const rows: (string | number | null | undefined)[][] = [[
    'Date', 'Workout', 'Status', 'Deload', 'Exercises Done', 'Exercises Total',
    `Volume (${unit})`, 'Calories (kcal)', 'Sauna', `Body Weight (${unit})`,
  ]]
  for (const d of days) {
    const bw = weightByDate.get(d.date) ?? latestWeight
    if (weightByDate.has(d.date)) latestWeight = bw
    const done = d.blocks.filter((b) => b.status === 'done').length
    rows.push([
      d.date, d.title, d.status, d.deload ? 'yes' : '',
      done, d.blocks.length,
      d.status === 'completed' ? Math.round(dayVolume(d, bw)) : 0,
      d.status === 'completed' ? Math.round(dayCalories(d, bw, unit, profile.saunaMinutes)) : 0,
      d.saunaDone ? 'yes' : '',
      weightByDate.get(d.date) ?? '',
    ])
  }
  return toCSV(rows)
}

/**
 * Health events in tidy, pivot-friendly shape: one row per meal category /
 * symptom / check-in, each stamped with whether its day was confirmed —
 * external analysis must know which symptom-free days are real.
 */
export async function buildHealthCSV(range: ExportRange): Promise<string> {
  const to = today()
  const from = range === 'all' ? '0000-00-00' : addDays(to, -range)
  const events = (await db.healthEvents.orderBy('timestamp').toArray()).filter(
    (e) => e.date >= from && e.date <= to,
  )
  const confirmedDates = new Set(events.filter((e) => e.type === 'day_confirm').map((e) => e.date))

  const rows: (string | number | null | undefined)[][] = [[
    'Date', 'Time', 'Type', 'Item', 'Severity', 'Location', 'Sleep', 'Stress', 'Hydration', 'Day Confirmed',
  ]]
  for (const e of events) {
    const time = new Date(e.timestamp).toLocaleTimeString([], { hour12: false })
    const conf = confirmedDates.has(e.date) ? 'yes' : ''
    if (e.type === 'meal') {
      for (const c of e.meal?.categories ?? []) {
        rows.push([e.date, time, 'meal', c, '', '', '', '', '', conf])
      }
    } else if (e.type === 'symptom') {
      rows.push([e.date, time, 'symptom', e.symptom?.symptom, e.symptom?.severity, e.symptom?.location ?? '', '', '', '', conf])
    } else if (e.type === 'context') {
      rows.push([e.date, time, 'checkin', '', '', '', e.context?.sleep, e.context?.stress, e.context?.hydration, conf])
    } else {
      rows.push([e.date, time, 'day_confirm', '', '', '', '', '', '', 'yes'])
    }
  }
  return toCSV(rows)
}

export function downloadCSV(content: string, name: string): void {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}-${today()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
