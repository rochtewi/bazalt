import Dexie, { type Table } from 'dexie'
import type {
  BodyMetric,
  CustomWorkout,
  ExerciseDef,
  ExerciseState,
  HealthEvent,
  MetaEntry,
  Profile,
  ScheduledDay,
} from './types'
import { DEFAULT_EQUIPMENT } from './data/exercises'
import { PRESET_WORKOUTS } from './data/presets'

class ForgeDB extends Dexie {
  profile!: Table<Profile, string>
  metrics!: Table<BodyMetric, number>
  schedule!: Table<ScheduledDay, number>
  exerciseState!: Table<ExerciseState, string>
  meta!: Table<MetaEntry, string>
  customExercises!: Table<ExerciseDef, string>
  customWorkouts!: Table<CustomWorkout, number>
  healthEvents!: Table<HealthEvent, number>

  constructor() {
    super('forge')
    this.version(1).stores({
      profile: 'id',
      metrics: '++id, date',
      schedule: '++id, &date, status',
      exerciseState: 'exerciseId',
      meta: 'key',
    })
    this.version(2)
      .stores({
        profile: 'id',
        metrics: '++id, date',
        schedule: '++id, &date, status',
        exerciseState: 'exerciseId',
        meta: 'key',
        customExercises: 'id',
        customWorkouts: '++id, name',
      })
      .upgrade(async (tx) => {
        // v1 installs predate the equipment field — grant the original gear.
        await tx.table('profile').toCollection().modify((p: Profile) => {
          if (!p.equipment) p.equipment = [...DEFAULT_EQUIPMENT]
        })
      })
    this.version(3).upgrade(async (tx) => {
      // Sauna became an equipment item; installs from before had sauna
      // features unconditionally, so keep that behavior for them.
      await tx.table('profile').toCollection().modify((p: Profile) => {
        if (p.equipment && !p.equipment.includes('sauna')) p.equipment.push('sauna')
      })
    })
    // v4: health tracking events (meals, symptoms, check-ins, day confirms).
    this.version(4).stores({
      healthEvents: '++id, date, type, timestamp',
    })
  }
}

export const db = new ForgeDB()

/**
 * Seed preset workouts. Versioned: on upgrades, new presets are added by name
 * (so updates bring new presets without resurrecting ones the user deleted in
 * the same version). Transaction makes it safe under concurrent calls.
 */
const PRESETS_VERSION = '2'

export async function seedPresets(): Promise<void> {
  await db.transaction('rw', [db.customWorkouts, db.meta], async () => {
    const ver = await db.meta.get('presetsVersion')
    if (ver?.value === PRESETS_VERSION) return
    const existing = new Set((await db.customWorkouts.toArray()).map((w) => w.name))
    if (existing.size === 0) {
      await db.customWorkouts.bulkPut(PRESET_WORKOUTS.map((w, i) => ({ ...w, id: i + 1 }) as CustomWorkout))
    } else {
      for (const w of PRESET_WORKOUTS) {
        if (!existing.has(w.name)) await db.customWorkouts.add(w as CustomWorkout)
      }
    }
    await db.meta.put({ key: 'presetsVersion', value: PRESETS_VERSION })
  })
}

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

/** Monday-anchored start of the week containing the given date. */
export function weekStart(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const dow = (dt.getDay() + 6) % 7 // Mon=0
  dt.setDate(dt.getDate() - dow)
  return isoDate(dt)
}
