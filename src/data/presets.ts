import type { CustomWorkout } from '../types'

/** Built-in hero/benchmark workouts, seeded into the custom-workout list. */
export const PRESET_WORKOUTS: Omit<CustomWorkout, 'id'>[] = [
  {
    name: 'Murph',
    focus: '1 mi run · 100 pull-ups · 200 push-ups · 300 squats · 1 mi run',
    preset: true,
    items: [
      { exerciseId: 'run', quantity: 1 },
      { exerciseId: 'pullups', sets: 10, reps: 10 },
      { exerciseId: 'pushups', sets: 10, reps: 20 },
      { exerciseId: 'air-squats', sets: 10, reps: 30 },
      { exerciseId: 'run', quantity: 1 },
    ],
  },
  {
    name: 'Murph (partitioned)',
    focus: 'Run, then 20 rounds of 5 pull-ups / 10 push-ups / 15 squats, run',
    preset: true,
    items: [
      { exerciseId: 'run', quantity: 1 },
      { exerciseId: 'pullups', sets: 20, reps: 5 },
      { exerciseId: 'pushups', sets: 20, reps: 10 },
      { exerciseId: 'air-squats', sets: 20, reps: 15 },
      { exerciseId: 'run', quantity: 1 },
    ],
  },
  {
    name: 'Cindy-style 20 min',
    focus: 'Rounds of 5 pull-ups / 10 push-ups / 15 air squats',
    preset: true,
    items: [
      { exerciseId: 'pullups', sets: 10, reps: 5 },
      { exerciseId: 'pushups', sets: 10, reps: 10 },
      { exerciseId: 'air-squats', sets: 10, reps: 15 },
    ],
  },
  {
    name: 'Sprint Pyramid',
    focus: 'Hill sprints with climbing then descending effort',
    preset: true,
    items: [
      { exerciseId: 'hill-sprints', sets: 1 },
      { exerciseId: 'air-squats', sets: 3, reps: 20 },
      { exerciseId: 'plank', sets: 3, seconds: 45 },
    ],
  },
]
