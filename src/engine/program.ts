import type { ExerciseDef } from '../types'
import { EXERCISE_MAP } from '../data/exercises'

export interface DayTemplate {
  key: string
  title: string
  focus: string
  sauna: boolean
  exercises: { id: string; sets: number }[]
}

/**
 * 7-day rotation. 6 training days + 1 rest day; in 5-day mode the
 * 'pull-b' day becomes rest. Sauna lands 4x/week on the heavier days.
 */
export const WEEK_TEMPLATE: DayTemplate[] = [
  {
    key: 'push-a',
    title: 'Push A',
    focus: 'Chest, shoulders, triceps',
    sauna: true,
    exercises: [
      { id: 'bench-press', sets: 4 },
      { id: 'incline-bench', sets: 3 },
      { id: 'dips', sets: 3 },
      { id: 'skull-crushers', sets: 3 },
    ],
  },
  {
    key: 'pull-a',
    title: 'Pull A',
    focus: 'Back, biceps, grip',
    sauna: false,
    exercises: [
      { id: 'pullups', sets: 4 },
      { id: 'bb-row', sets: 4 },
      { id: 'ez-curl', sets: 3 },
      { id: 'hanging-knee-raise', sets: 3 },
    ],
  },
  {
    key: 'legs-a',
    title: 'Legs A',
    focus: 'Heavy hinge + single leg',
    sauna: true,
    exercises: [
      { id: 'deadlift', sets: 3 },
      { id: 'reverse-lunge', sets: 3 },
      { id: 'hip-thrust', sets: 3 },
      { id: 'calf-raise', sets: 3 },
    ],
  },
  {
    key: 'sprints',
    title: 'Sprint Day',
    focus: 'Hill sprints + core',
    sauna: true,
    exercises: [
      { id: 'hill-sprints', sets: 1 },
      { id: 'plank', sets: 3 },
      { id: 'hanging-leg-raise', sets: 3 },
    ],
  },
  {
    key: 'push-b',
    title: 'Push B',
    focus: 'Incline strength + overhead',
    sauna: false,
    exercises: [
      { id: 'incline-bench', sets: 4 },
      { id: 'ohp', sets: 3 },
      { id: 'close-grip-bench', sets: 3 },
      { id: 'dips', sets: 2 },
    ],
  },
  {
    key: 'pull-b',
    title: 'Pull B + Posterior',
    focus: 'RDL, rows, arms',
    sauna: true,
    exercises: [
      { id: 'rdl', sets: 3 },
      { id: 'pendlay-row', sets: 3 },
      { id: 'chinups', sets: 3 },
      { id: 'bb-curl', sets: 3 },
    ],
  },
  {
    key: 'rest',
    title: 'Rest Day',
    focus: 'Recovery — walk, stretch, optional sauna',
    sauna: false,
    exercises: [],
  },
]

export const REST_TEMPLATE = WEEK_TEMPLATE[6]

/** Template for day N of the program (0-based), honoring 5- vs 6-day mode. */
export function templateForIndex(dayIndex: number, daysPerWeek: 5 | 6): DayTemplate {
  const slot = ((dayIndex % 7) + 7) % 7
  const t = WEEK_TEMPLATE[slot]
  if (daysPerWeek === 5 && t.key === 'pull-b') return REST_TEMPLATE
  return t
}

export function defFor(id: string): ExerciseDef {
  const def = EXERCISE_MAP.get(id)
  if (!def) throw new Error(`Unknown exercise: ${id}`)
  return def
}
