import type { ExerciseDef } from '../types'
import { defFor as libraryDefFor } from '../data/library'

export interface DayTemplate {
  key: string
  title: string
  focus: string
  sauna: boolean
  exercises: { id: string; sets: number }[]
}

/**
 * 4-week rotating cycle — 24 distinct training days before anything repeats.
 * Each week keeps the same rhythm (push / pull / legs / conditioning / push /
 * pull / rest; 5-day mode turns the second pull day into rest) but the lifts,
 * angles, and core slot change every single day. Exercises here are written
 * for the base home gym; the scheduler substitutes same-pattern alternatives
 * for anything the user's equipment can't do.
 */
const REST: DayTemplate = {
  key: 'rest',
  title: 'Rest Day',
  focus: 'Recovery — walk, stretch, optional sauna',
  sauna: false,
  exercises: [],
}

const CYCLE: DayTemplate[][] = [
  // ---- Week 1: heavy foundations ----
  [
    {
      key: 'push-1', title: 'Push · Heavy Bench', focus: 'Chest strength, triceps', sauna: true,
      exercises: [
        { id: 'bench-press', sets: 4 },
        { id: 'ohp', sets: 3 },
        { id: 'dips', sets: 3 },
        { id: 'close-grip-bench', sets: 3 },
        { id: 'bicycles', sets: 3 },
      ],
    },
    {
      key: 'pull-1', title: 'Pull · Rows & Chins', focus: 'Back width, biceps, grip', sauna: false,
      exercises: [
        { id: 'pullups', sets: 4 },
        { id: 'bb-row', sets: 4 },
        { id: 'bb-curl', sets: 3 },
        { id: 'hanging-knee-raise', sets: 3 },
        { id: 'mason-twist', sets: 3 },
      ],
    },
    {
      key: 'legs-1', title: 'Legs · Heavy Hinge', focus: 'Deadlift, single leg, glutes', sauna: true,
      exercises: [
        { id: 'deadlift', sets: 3 },
        { id: 'reverse-lunge', sets: 3 },
        { id: 'hip-thrust', sets: 3 },
        { id: 'calf-raise', sets: 3 },
        { id: 'weighted-situp', sets: 3 },
      ],
    },
    {
      key: 'cond-1', title: 'Sprints · Hills', focus: 'Hill sprints + hanging core', sauna: true,
      exercises: [
        { id: 'hill-sprints', sets: 1 },
        { id: 'plank', sets: 3 },
        { id: 'hanging-leg-raise', sets: 3 },
        { id: 'oblique-v-ups', sets: 3 },
      ],
    },
    {
      key: 'push-2', title: 'Push · Incline & Overhead', focus: 'Upper chest, shoulders', sauna: false,
      exercises: [
        { id: 'incline-bench', sets: 4 },
        { id: 'push-press', sets: 3 },
        { id: 'pushups', sets: 3 },
        { id: 'bench-dips', sets: 3 },
        { id: 'v-ups', sets: 3 },
      ],
    },
    {
      key: 'pull-2', title: 'Pull · Posterior Chain', focus: 'RDL, rows, obliques', sauna: true,
      exercises: [
        { id: 'rdl', sets: 3 },
        { id: 'pendlay-row', sets: 3 },
        { id: 'chinups', sets: 3 },
        { id: 'plate-russian-twist', sets: 3 },
        { id: 'reverse-crunch', sets: 3 },
      ],
    },
    REST,
  ],
  // ---- Week 2: volume and new angles ----
  [
    {
      key: 'push-3', title: 'Push · Incline First', focus: 'Upper chest priority, shoulders', sauna: true,
      exercises: [
        { id: 'incline-bench', sets: 4 },
        { id: 'close-grip-bench', sets: 3 },
        { id: 'dips', sets: 3 },
        { id: 'pike-pushups', sets: 3 },
        { id: 'crunchy-frog', sets: 3 },
      ],
    },
    {
      key: 'pull-3', title: 'Pull · Chin-Up Volume', focus: 'Chins, strict rows, obliques', sauna: false,
      exercises: [
        { id: 'chinups', sets: 4 },
        { id: 'pendlay-row', sets: 4 },
        { id: 'inverted-row', sets: 3 },
        { id: 'hanging-oblique-raise', sets: 3 },
        { id: 'flutter-kicks', sets: 3 },
      ],
    },
    {
      key: 'legs-2', title: 'Legs · Front Squat', focus: 'Quads, hamstrings, single leg', sauna: true,
      exercises: [
        { id: 'front-squat', sets: 4 },
        { id: 'rdl', sets: 3 },
        { id: 'split-squat', sets: 3 },
        { id: 'bw-calf-raise', sets: 3 },
        { id: 'plate-side-bend', sets: 3 },
      ],
    },
    {
      key: 'cond-2', title: 'Sprints · Wind Bike', focus: 'Bike intervals + core control', sauna: true,
      exercises: [
        { id: 'bike-sprints', sets: 1 },
        { id: 'hollow-hold', sets: 3 },
        { id: 'toes-to-bar', sets: 3 },
        { id: 'side-plank-dips', sets: 3 },
      ],
    },
    {
      key: 'push-4', title: 'Push · Bench & Strict Press', focus: 'Chest, strict overhead', sauna: false,
      exercises: [
        { id: 'bench-press', sets: 4 },
        { id: 'ohp', sets: 3 },
        { id: 'plate-raise', sets: 3 },
        { id: 'pushups', sets: 3 },
        { id: 'in-outs', sets: 3 },
      ],
    },
    {
      key: 'pull-4', title: 'Pull · Deadlift Day', focus: 'Heavy pull, weighted chins', sauna: true,
      exercises: [
        { id: 'deadlift', sets: 3 },
        { id: 'bb-row', sets: 3 },
        { id: 'weighted-pullups', sets: 3 },
        { id: 'bb-curl', sets: 3 },
        { id: 'weighted-plank', sets: 3 },
      ],
    },
    REST,
  ],
  // ---- Week 3: strength focus, new pairings ----
  [
    {
      key: 'push-5', title: 'Push · Bench & Floor Press', focus: 'Pressing strength, lockout', sauna: true,
      exercises: [
        { id: 'bench-press', sets: 4 },
        { id: 'floor-press', sets: 3 },
        { id: 'dips', sets: 3 },
        { id: 'plate-raise', sets: 3 },
        { id: 'wide-leg-situps', sets: 3 },
      ],
    },
    {
      key: 'pull-5', title: 'Pull · Weighted Chins', focus: 'Weighted pull-ups, heavy rows', sauna: false,
      exercises: [
        { id: 'weighted-pullups', sets: 4 },
        { id: 'bb-row', sets: 4 },
        { id: 'good-morning', sets: 3 },
        { id: 'windshield-wipers', sets: 3 },
        { id: 'bicycles', sets: 3 },
      ],
    },
    {
      key: 'legs-3', title: 'Legs · Deadlift Heavy', focus: 'Max hinge, glutes, calves', sauna: true,
      exercises: [
        { id: 'deadlift', sets: 4 },
        { id: 'hip-thrust', sets: 3 },
        { id: 'reverse-lunge', sets: 3 },
        { id: 'calf-raise', sets: 3 },
        { id: 'pulse-ups', sets: 3 },
      ],
    },
    {
      key: 'cond-3', title: 'Sprints · Hills Again', focus: 'Hill sprints + midline', sauna: true,
      exercises: [
        { id: 'hill-sprints', sets: 1 },
        { id: 'l-sit', sets: 3 },
        { id: 'mason-twist', sets: 3 },
        { id: 'leg-climbs', sets: 3 },
      ],
    },
    {
      key: 'push-6', title: 'Push · Push Press Power', focus: 'Explosive overhead, incline', sauna: false,
      exercises: [
        { id: 'push-press', sets: 4 },
        { id: 'incline-bench', sets: 3 },
        { id: 'close-grip-bench', sets: 3 },
        { id: 'bench-dips', sets: 2 },
        { id: 'fifer-scissors', sets: 3 },
      ],
    },
    {
      key: 'pull-6', title: 'Pull · Row Variety', focus: 'Inverted rows, RDL, arms', sauna: true,
      exercises: [
        { id: 'rdl', sets: 3 },
        { id: 'inverted-row', sets: 4 },
        { id: 'chinups', sets: 3 },
        { id: 'plate-russian-twist', sets: 3 },
        { id: 'dead-bug', sets: 3 },
      ],
    },
    REST,
  ],
  // ---- Week 4: density and burn ----
  [
    {
      key: 'push-7', title: 'Push · High Volume', focus: 'Incline, overhead, push-up burn', sauna: true,
      exercises: [
        { id: 'incline-bench', sets: 4 },
        { id: 'ohp', sets: 3 },
        { id: 'pushups', sets: 4 },
        { id: 'bench-dips', sets: 3 },
        { id: 'hip-rock-raise', sets: 3 },
      ],
    },
    {
      key: 'pull-7', title: 'Pull · Bar Work', focus: 'Pull-ups, rows, hanging core', sauna: false,
      exercises: [
        { id: 'pullups', sets: 4 },
        { id: 'pendlay-row', sets: 3 },
        { id: 'bb-curl', sets: 3 },
        { id: 'toes-to-bar', sets: 3 },
        { id: 'side-plank', sets: 3 },
      ],
    },
    {
      key: 'legs-4', title: 'Legs · Squat & Bridge', focus: 'Front squat, glutes, hamstrings', sauna: true,
      exercises: [
        { id: 'front-squat', sets: 4 },
        { id: 'good-morning', sets: 3 },
        { id: 'split-squat', sets: 3 },
        { id: 'glute-bridge', sets: 3 },
        { id: 'weighted-situp', sets: 3 },
      ],
    },
    {
      key: 'cond-4', title: 'Engine · Steady State', focus: 'Long bike effort + core finish', sauna: true,
      exercises: [
        { id: 'bike-steady', sets: 1 },
        { id: 'hanging-knee-raise', sets: 3 },
        { id: 'oblique-v-ups', sets: 3 },
        { id: 'plank', sets: 3 },
      ],
    },
    {
      key: 'push-8', title: 'Push · Bench Closer', focus: 'Bench, pike press, dips', sauna: false,
      exercises: [
        { id: 'bench-press', sets: 4 },
        { id: 'pike-pushups', sets: 3 },
        { id: 'dips', sets: 3 },
        { id: 'plate-raise', sets: 3 },
        { id: 'reverse-crunch', sets: 3 },
      ],
    },
    {
      key: 'pull-8', title: 'Pull · Cycle Finisher', focus: 'Deadlift, rows, weighted chins', sauna: true,
      exercises: [
        { id: 'deadlift', sets: 3 },
        { id: 'bb-row', sets: 4 },
        { id: 'weighted-pullups', sets: 3 },
        { id: 'hanging-oblique-raise', sets: 3 },
        { id: 'flutter-kicks', sets: 3 },
      ],
    },
    REST,
  ],
]

export const REST_TEMPLATE = REST

/** All templates, for migrations that look days up by key. */
export const ALL_TEMPLATES: DayTemplate[] = CYCLE.flat()

/** Template for day N of the program (0-based), honoring 5- vs 6-day mode. */
export function templateForIndex(dayIndex: number, daysPerWeek: 5 | 6): DayTemplate {
  const safe = ((dayIndex % 28) + 28) % 28
  const week = Math.floor(safe / 7)
  const slot = safe % 7
  const t = CYCLE[week][slot]
  // 5-day mode: the second pull day of each week becomes rest.
  if (daysPerWeek === 5 && slot === 5) return REST
  return t
}

export function defFor(id: string): ExerciseDef {
  return libraryDefFor(id)
}
