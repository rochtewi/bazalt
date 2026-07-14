// ---------- Profile & body ----------

export interface Profile {
  id: string // always 'me'
  name: string
  unit: 'lb' | 'kg'
  daysPerWeek: 5 | 6
  saunaMinutes: number
  notifyHour: number // 0-23, local time, used for ICS alarms
  programStart: string // ISO date the program was anchored
  createdAt: string
  equipment?: Equipment[] // owned equipment; defaults applied on migration
  gear?: Gear // weight inventory; defaults applied on first load
}

/**
 * The weights the user actually owns. Targets are only ever prescribed as
 * loads buildable from this inventory — no more impossible plate math.
 */
export interface Gear {
  barWeight: number // main barbell, in profile units
  ezBarWeight: number // EZ / specialty bar, if owned
  platePairs: Record<string, number> // plate weight -> pairs owned ('45' -> 2)
  dumbbells: number[] // per-hand dumbbell weights owned
  kettlebells: number[] // kettlebell weights owned
}

export interface BodyMetric {
  id?: number
  date: string // ISO yyyy-mm-dd
  weight: number // in profile.unit
  note?: string
}

// ---------- Exercise library ----------

export type MovementPattern =
  | 'horizontal-push'
  | 'vertical-push'
  | 'horizontal-pull'
  | 'vertical-pull'
  | 'hinge'
  | 'squat'
  | 'lunge'
  | 'glute'
  | 'arms'
  | 'shoulders'
  | 'calves'
  | 'core'
  | 'conditioning'
  | 'activity'

export type Equipment =
  | 'barbell'
  | 'ez-bar'
  | 'bench'
  | 'bench-rack' // bench press stand, incline-adjustable
  | 'dip-bars'
  | 'pullup-bar'
  | 'plates'
  | 'bike'
  | 'hill'
  | 'bodyweight'
  | 'dumbbells'
  | 'kettlebell'
  | 'squat-rack'
  | 'bands'
  | 'rings'
  | 'weight-vest'
  | 'rower'
  | 'cable'
  | 'trap-bar'
  | 'sled'
  | 'jump-rope'
  | 'medicine-ball'
  | 'sauna'

export type ExerciseKind = 'weighted' | 'bodyweight' | 'timed' | 'intervals' | 'activity'
export type ActivityUnit = 'miles' | 'minutes'

export interface ExerciseDef {
  id: string
  name: string
  pattern: MovementPattern
  kind: ExerciseKind
  equipment: Equipment[]
  repRange?: [number, number] // weighted/bodyweight
  startWeight?: number // suggested first-session weight (user units)
  increment?: number // added when top of rep range is reached
  seconds?: number // timed holds
  rounds?: number // intervals
  workSeconds?: number // intervals: work duration
  restSeconds?: number // intervals: rest duration
  unit?: ActivityUnit // activities
  defaultQuantity?: number // activities
  met?: number // metabolic equivalent for calorie estimates
  bwFactor?: number // fraction of body weight moved per rep (bodyweight moves)
  cue?: string
  custom?: boolean // user-created
}

// ---------- Custom workouts ----------

export interface CustomWorkoutItem {
  exerciseId: string
  sets?: number // weighted/bodyweight
  reps?: number // fixed rep target per set (custom workouts use exact reps)
  quantity?: number // activities: miles or minutes
  seconds?: number // timed
}

export interface CustomWorkout {
  id?: number
  name: string
  focus: string
  preset?: boolean
  items: CustomWorkoutItem[]
}

// ---------- Scheduling ----------

export type WorkoutStatus = 'pending' | 'completed' | 'skipped'
export type BlockStatus = 'pending' | 'done' | 'skipped'

export interface SetEntry {
  targetReps: [number, number] | null // null for timed/intervals/activity
  targetWeight: number | null
  actualReps?: number
  actualWeight?: number
  done: boolean
}

export interface WorkoutBlock {
  exerciseId: string
  name: string
  kind: ExerciseKind
  status: BlockStatus
  sets: SetEntry[]
  seconds?: number
  rounds?: number
  workSeconds?: number
  restSeconds?: number
  unit?: ActivityUnit
  quantity?: number // planned activity quantity
  actualQuantity?: number // logged activity quantity
  swappedFrom?: string
  lastSummary?: string // what was logged last time this exercise was completed
}

export interface ScheduledDay {
  id?: number
  date: string // ISO yyyy-mm-dd, unique
  templateKey: string // 'push-a' | ... | 'rest' | 'custom'
  title: string
  focus: string
  status: WorkoutStatus
  sauna: boolean
  saunaDone: boolean
  blocks: WorkoutBlock[]
  deload?: boolean
  custom?: boolean
  completedAt?: string
  programIndex?: number // position in the program rotation; lets pending days rebuild deterministically
}

// Per-exercise progression memory
export interface ExerciseState {
  exerciseId: string // primary key
  weight: number | null // current working weight (user units)
  bestReps: number | null // bodyweight movements
  rounds: number | null // intervals
  seconds: number | null // timed
  timesCompleted: number
  updatedAt: string
  lastSummary?: string // human-readable log of the last completed session
}

export interface MetaEntry {
  key: string
  value: string
}

// ---------- Health tracking ----------
// Fast tap-based events: meals (broad categories), symptoms with severity,
// an optional evening check-in, and a "day confirmed" marker meaning absence
// of symptom logs that day genuinely means symptom-free.

export type HealthEventType = 'meal' | 'symptom' | 'context' | 'day_confirm'
export type Severity = 1 | 2 | 3

export interface HealthEvent {
  id?: number
  type: HealthEventType
  timestamp: string // ISO datetime, user-adjustable at entry
  date: string // local yyyy-mm-dd derived from timestamp, for grouping/queries
  meal?: { categories: string[] }
  symptom?: { symptom: string; severity: Severity; location?: string }
  context?: { sleep: Severity; stress: Severity; hydration: Severity }
}

/** User-editable logging vocabularies. Archived items stay attached to old events. */
export interface HealthListItem {
  id: string
  label: string
  archived?: boolean
}
