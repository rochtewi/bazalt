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
}

export interface MetaEntry {
  key: string
  value: string
}
