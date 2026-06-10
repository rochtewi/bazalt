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
  | 'calves'
  | 'core'
  | 'conditioning'

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

export type ExerciseKind = 'weighted' | 'bodyweight' | 'timed' | 'intervals'

export interface ExerciseDef {
  id: string
  name: string
  pattern: MovementPattern
  kind: ExerciseKind
  equipment: Equipment[]
  repRange?: [number, number] // weighted/bodyweight
  startWeight?: number // suggested first-session weight (lb)
  increment?: number // lb added when top of rep range is reached
  seconds?: number // timed holds
  rounds?: number // intervals
  workSeconds?: number // intervals: work duration
  restSeconds?: number // intervals: rest duration
  cue?: string
}

// ---------- Scheduling ----------

export type WorkoutStatus = 'pending' | 'completed' | 'skipped'
export type BlockStatus = 'pending' | 'done' | 'skipped'

export interface SetEntry {
  targetReps: [number, number] | null // null for timed/intervals
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
  swappedFrom?: string
}

export interface ScheduledDay {
  id?: number
  date: string // ISO yyyy-mm-dd, unique
  templateKey: string // 'push-a' | ... | 'rest'
  title: string
  focus: string
  status: WorkoutStatus
  sauna: boolean
  saunaDone: boolean
  blocks: WorkoutBlock[]
  completedAt?: string
}

// Per-exercise progression memory
export interface ExerciseState {
  exerciseId: string // primary key
  weight: number | null // current working weight (lb-equivalent stored in user unit)
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
