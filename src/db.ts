import Dexie, { type Table } from 'dexie'
import type { BodyMetric, ExerciseState, MetaEntry, Profile, ScheduledDay } from './types'

class ForgeDB extends Dexie {
  profile!: Table<Profile, string>
  metrics!: Table<BodyMetric, number>
  schedule!: Table<ScheduledDay, number>
  exerciseState!: Table<ExerciseState, string>
  meta!: Table<MetaEntry, string>

  constructor() {
    super('forge')
    this.version(1).stores({
      profile: 'id',
      metrics: '++id, date',
      schedule: '++id, &date, status',
      exerciseState: 'exerciseId',
      meta: 'key',
    })
  }
}

export const db = new ForgeDB()

export async function getMeta(key: string): Promise<string | null> {
  const row = await db.meta.get(key)
  return row?.value ?? null
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value })
}

/** Local date as yyyy-mm-dd (never UTC — workouts belong to the user's day). */
export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  return isoDate(dt)
}

export function today(): string {
  return isoDate(new Date())
}
