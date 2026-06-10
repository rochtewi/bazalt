import type { Equipment, ExerciseDef } from '../types'

/**
 * Exercise library grounded in the user's actual home equipment:
 * barbells (+ plates), an EZ/specialty bar, adjustable bench with incline-capable
 * press rack, dip bars, pull-up bar, wind bike, and hills outside.
 * No squat rack is assumed, so lower-body work is floor-based (deadlifts,
 * lunges, hip thrusts) rather than back squats.
 */
export const EXERCISES: ExerciseDef[] = [
  // ---- Horizontal push ----
  { id: 'bench-press', name: 'Barbell Bench Press', pattern: 'horizontal-push', kind: 'weighted', equipment: ['barbell', 'bench', 'bench-rack', 'plates'], repRange: [6, 10], startWeight: 95, increment: 5, cue: 'Feet planted, shoulder blades pinched, bar to mid-chest.' },
  { id: 'incline-bench', name: 'Incline Bench Press', pattern: 'horizontal-push', kind: 'weighted', equipment: ['barbell', 'bench', 'bench-rack', 'plates'], repRange: [6, 10], startWeight: 75, increment: 5, cue: 'Bench at 30–45°. Touch just below the collarbone.' },
  { id: 'close-grip-bench', name: 'Close-Grip Bench Press', pattern: 'horizontal-push', kind: 'weighted', equipment: ['barbell', 'bench', 'bench-rack', 'plates'], repRange: [8, 12], startWeight: 75, increment: 5, cue: 'Hands just inside shoulder width, elbows tucked.' },
  { id: 'floor-press', name: 'Barbell Floor Press', pattern: 'horizontal-push', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [8, 12], startWeight: 75, increment: 5, cue: 'Lying on the floor — pause when triceps touch down.' },
  { id: 'dips', name: 'Dips', pattern: 'horizontal-push', kind: 'bodyweight', equipment: ['dip-bars'], repRange: [6, 15], cue: 'Slight forward lean, shoulder to elbow height, drive up.' },
  { id: 'pushups', name: 'Push-Ups', pattern: 'horizontal-push', kind: 'bodyweight', equipment: ['bodyweight'], repRange: [10, 25], cue: 'Body in one line, full range.' },

  // ---- Vertical push ----
  { id: 'ohp', name: 'Standing Overhead Press', pattern: 'vertical-push', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [6, 10], startWeight: 65, increment: 5, cue: 'Clean the bar to your shoulders, squeeze glutes, press strict.' },
  { id: 'push-press', name: 'Push Press', pattern: 'vertical-push', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [6, 8], startWeight: 75, increment: 5, cue: 'Small leg drive, lock out overhead.' },
  { id: 'pike-pushups', name: 'Pike Push-Ups', pattern: 'vertical-push', kind: 'bodyweight', equipment: ['bodyweight'], repRange: [8, 15], cue: 'Hips high, head toward the floor between your hands.' },

  // ---- Horizontal pull ----
  { id: 'bb-row', name: 'Barbell Row', pattern: 'horizontal-pull', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [6, 10], startWeight: 95, increment: 5, cue: 'Hinge to ~45°, pull to lower ribs, no body English.' },
  { id: 'pendlay-row', name: 'Pendlay Row', pattern: 'horizontal-pull', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [6, 8], startWeight: 95, increment: 5, cue: 'Back parallel to floor, bar dead-stops on the ground each rep.' },
  { id: 'inverted-row', name: 'Inverted Row', pattern: 'horizontal-pull', kind: 'bodyweight', equipment: ['barbell', 'bench-rack'], repRange: [8, 15], cue: 'Bar racked low, body straight, chest to bar.' },

  // ---- Vertical pull ----
  { id: 'pullups', name: 'Pull-Ups', pattern: 'vertical-pull', kind: 'bodyweight', equipment: ['pullup-bar'], repRange: [4, 12], cue: 'Dead hang to chin over bar. Add weight once 12 is easy.' },
  { id: 'chinups', name: 'Chin-Ups', pattern: 'vertical-pull', kind: 'bodyweight', equipment: ['pullup-bar'], repRange: [4, 12], cue: 'Palms facing you — more biceps, same back.' },
  { id: 'weighted-pullups', name: 'Weighted Pull-Ups', pattern: 'vertical-pull', kind: 'weighted', equipment: ['pullup-bar', 'plates'], repRange: [4, 8], startWeight: 10, increment: 5, cue: 'Plate in a backpack or on a belt.' },

  // ---- Hinge ----
  { id: 'deadlift', name: 'Deadlift', pattern: 'hinge', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [4, 6], startWeight: 135, increment: 10, cue: 'Brace hard, push the floor away, lock out tall.' },
  { id: 'rdl', name: 'Romanian Deadlift', pattern: 'hinge', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [8, 10], startWeight: 95, increment: 10, cue: 'Soft knees, hips back until hamstrings load, stand up.' },
  { id: 'good-morning', name: 'Good Morning (light)', pattern: 'hinge', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [10, 12], startWeight: 45, increment: 5, cue: 'Bar on upper back, hinge slow, stay light.' },

  // ---- Squat / lunge / glute ----
  { id: 'front-squat', name: 'Front Squat (clean grip)', pattern: 'squat', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [6, 8], startWeight: 75, increment: 5, cue: 'Clean the bar up, elbows high, sit between your heels.' },
  { id: 'reverse-lunge', name: 'Barbell Reverse Lunge', pattern: 'lunge', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [8, 10], startWeight: 65, increment: 5, cue: 'Per leg. Step back, knee kisses the floor, drive through the front heel.' },
  { id: 'split-squat', name: 'Bulgarian Split Squat (rear foot on bench)', pattern: 'lunge', kind: 'weighted', equipment: ['barbell', 'bench', 'plates'], repRange: [8, 12], startWeight: 45, increment: 5, cue: 'Per leg. Rear foot up on the bench, torso tall.' },
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', pattern: 'glute', kind: 'weighted', equipment: ['barbell', 'bench', 'plates'], repRange: [8, 12], startWeight: 95, increment: 10, cue: 'Upper back on the bench, squeeze hard at the top.' },
  { id: 'calf-raise', name: 'Standing Barbell Calf Raise', pattern: 'calves', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [12, 15], startWeight: 95, increment: 10, cue: 'Pause at the top, full stretch at the bottom.' },

  // ---- Arms ----
  { id: 'ez-curl', name: 'EZ-Bar Curl', pattern: 'arms', kind: 'weighted', equipment: ['ez-bar', 'plates'], repRange: [8, 12], startWeight: 40, increment: 5, cue: 'Elbows pinned to your sides.' },
  { id: 'bb-curl', name: 'Barbell Curl', pattern: 'arms', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [8, 12], startWeight: 45, increment: 5 },
  { id: 'skull-crushers', name: 'EZ-Bar Skull Crushers', pattern: 'arms', kind: 'weighted', equipment: ['ez-bar', 'bench', 'plates'], repRange: [8, 12], startWeight: 40, increment: 5, cue: 'Lower to the forehead, elbows still.' },
  { id: 'bench-dips', name: 'Bench Dips', pattern: 'arms', kind: 'bodyweight', equipment: ['bench'], repRange: [10, 20] },

  // ---- Core ----
  { id: 'hanging-knee-raise', name: 'Hanging Knee Raise', pattern: 'core', kind: 'bodyweight', equipment: ['pullup-bar'], repRange: [10, 15], cue: 'No swing — curl the hips up.' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', pattern: 'core', kind: 'bodyweight', equipment: ['pullup-bar'], repRange: [8, 12], cue: 'Straight legs to parallel or higher.' },
  { id: 'plank', name: 'Plank', pattern: 'core', kind: 'timed', equipment: ['bodyweight'], seconds: 45, cue: 'Glutes tight, ribs down.' },
  { id: 'side-plank', name: 'Side Plank', pattern: 'core', kind: 'timed', equipment: ['bodyweight'], seconds: 30, cue: 'Per side.' },

  // ---- Conditioning ----
  { id: 'hill-sprints', name: 'Hill Sprints', pattern: 'conditioning', kind: 'intervals', equipment: ['hill'], rounds: 6, workSeconds: 15, restSeconds: 105, cue: 'Sprint up hard, walk down to recover. Quality over quantity.' },
  { id: 'bike-sprints', name: 'Wind Bike Sprints', pattern: 'conditioning', kind: 'intervals', equipment: ['bike'], rounds: 6, workSeconds: 20, restSeconds: 100, cue: 'All-out effort, easy spin to recover.' },
  { id: 'bike-steady', name: 'Wind Bike — Steady State', pattern: 'conditioning', kind: 'timed', equipment: ['bike'], seconds: 1200, cue: 'Conversational pace, 20 minutes.' },
]

export const EXERCISE_MAP = new Map(EXERCISES.map((e) => [e.id, e]))

/** Equipment the user told us they own. Editable later in Settings. */
export const OWNED_EQUIPMENT: Equipment[] = [
  'barbell', 'ez-bar', 'bench', 'bench-rack', 'dip-bars', 'pullup-bar', 'plates', 'bike', 'hill', 'bodyweight',
]

/** Alternatives with the same movement pattern doable with owned equipment. */
export function swapsFor(exerciseId: string, owned: Equipment[] = OWNED_EQUIPMENT): ExerciseDef[] {
  const def = EXERCISE_MAP.get(exerciseId)
  if (!def) return []
  return EXERCISES.filter(
    (e) => e.id !== exerciseId && e.pattern === def.pattern && e.equipment.every((q) => owned.includes(q)),
  )
}
