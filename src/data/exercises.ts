import type { Equipment, ExerciseDef } from '../types'

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell + plates',
  'ez-bar': 'EZ / specialty bar',
  bench: 'Adjustable bench',
  'bench-rack': 'Bench press rack (incline)',
  'dip-bars': 'Dip bars',
  'pullup-bar': 'Pull-up bar',
  plates: 'Weight plates',
  bike: 'Wind bike',
  hill: 'Hills outside',
  bodyweight: 'Bodyweight (always on)',
  dumbbells: 'Dumbbells',
  kettlebell: 'Kettlebell(s)',
  'squat-rack': 'Squat rack',
  bands: 'Resistance bands',
  rings: 'Gymnastic rings',
  'weight-vest': 'Weight vest',
  rower: 'Rowing machine',
  cable: 'Cable pulley',
  'trap-bar': 'Trap bar',
  sled: 'Sled',
  'jump-rope': 'Jump rope',
  'medicine-ball': 'Medicine ball',
}

/** Equipment the user owns by default (from their original setup). */
export const DEFAULT_EQUIPMENT: Equipment[] = [
  'barbell', 'ez-bar', 'bench', 'bench-rack', 'dip-bars', 'pullup-bar', 'plates', 'bike', 'hill', 'bodyweight',
]

/**
 * Built-in exercise library. Each entry is tagged by required equipment;
 * checking new gear in Settings unlocks its exercises for swaps and programs.
 * bwFactor ≈ fraction of body weight moved per rep (for tonnage estimates);
 * met ≈ metabolic equivalent (for calorie estimates).
 */
export const EXERCISES: ExerciseDef[] = [
  // ---- Horizontal push ----
  { id: 'bench-press', name: 'Barbell Bench Press', pattern: 'horizontal-push', kind: 'weighted', equipment: ['barbell', 'bench', 'bench-rack', 'plates'], repRange: [6, 10], startWeight: 95, increment: 5, cue: 'Feet planted, shoulder blades pinched, bar to mid-chest.' },
  { id: 'incline-bench', name: 'Incline Bench Press', pattern: 'horizontal-push', kind: 'weighted', equipment: ['barbell', 'bench', 'bench-rack', 'plates'], repRange: [6, 10], startWeight: 75, increment: 5, cue: 'Bench at 30–45°. Touch just below the collarbone.' },
  { id: 'close-grip-bench', name: 'Close-Grip Bench Press', pattern: 'horizontal-push', kind: 'weighted', equipment: ['barbell', 'bench', 'bench-rack', 'plates'], repRange: [8, 12], startWeight: 75, increment: 5, cue: 'Hands just inside shoulder width, elbows tucked.' },
  { id: 'floor-press', name: 'Barbell Floor Press', pattern: 'horizontal-push', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [8, 12], startWeight: 75, increment: 5, cue: 'Lying on the floor — pause when triceps touch down.' },
  { id: 'db-bench', name: 'Dumbbell Bench Press', pattern: 'horizontal-push', kind: 'weighted', equipment: ['dumbbells', 'bench'], repRange: [8, 12], startWeight: 30, increment: 5, cue: 'Per hand. Deep stretch at the bottom.' },
  { id: 'db-incline-bench', name: 'Dumbbell Incline Press', pattern: 'horizontal-push', kind: 'weighted', equipment: ['dumbbells', 'bench'], repRange: [8, 12], startWeight: 25, increment: 5 },
  { id: 'db-fly', name: 'Dumbbell Fly', pattern: 'horizontal-push', kind: 'weighted', equipment: ['dumbbells', 'bench'], repRange: [10, 15], startWeight: 15, increment: 5, cue: 'Slight elbow bend, hug a barrel.' },
  { id: 'dips', name: 'Dips', pattern: 'horizontal-push', kind: 'bodyweight', equipment: ['dip-bars'], repRange: [6, 15], bwFactor: 0.95, cue: 'Slight forward lean, shoulder to elbow height, drive up.' },
  { id: 'ring-dips', name: 'Ring Dips', pattern: 'horizontal-push', kind: 'bodyweight', equipment: ['rings'], repRange: [4, 10], bwFactor: 0.95, cue: 'Turn the rings out at lockout.' },
  { id: 'pushups', name: 'Push-Ups', pattern: 'horizontal-push', kind: 'bodyweight', equipment: ['bodyweight'], repRange: [10, 25], bwFactor: 0.64, cue: 'Body in one line, full range.' },
  { id: 'weighted-pushups', name: 'Weighted Push-Ups (vest)', pattern: 'horizontal-push', kind: 'bodyweight', equipment: ['weight-vest'], repRange: [8, 15], bwFactor: 0.8 },
  { id: 'band-pushups', name: 'Banded Push-Ups', pattern: 'horizontal-push', kind: 'bodyweight', equipment: ['bands'], repRange: [8, 15], bwFactor: 0.7, cue: 'Band across the back, hands pinning the ends.' },

  // ---- Vertical push ----
  { id: 'ohp', name: 'Standing Overhead Press', pattern: 'vertical-push', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [6, 10], startWeight: 65, increment: 5, cue: 'Clean the bar to your shoulders, squeeze glutes, press strict.' },
  { id: 'push-press', name: 'Push Press', pattern: 'vertical-push', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [6, 8], startWeight: 75, increment: 5, cue: 'Small leg drive, lock out overhead.' },
  { id: 'db-ohp', name: 'Dumbbell Shoulder Press', pattern: 'vertical-push', kind: 'weighted', equipment: ['dumbbells'], repRange: [8, 12], startWeight: 25, increment: 5, cue: 'Per hand. Seated or standing.' },
  { id: 'kb-press', name: 'Kettlebell Press', pattern: 'vertical-push', kind: 'weighted', equipment: ['kettlebell'], repRange: [6, 10], startWeight: 35, increment: 9, cue: 'Per arm. Rack it tight, press slightly out.' },
  { id: 'pike-pushups', name: 'Pike Push-Ups', pattern: 'vertical-push', kind: 'bodyweight', equipment: ['bodyweight'], repRange: [8, 15], bwFactor: 0.7, cue: 'Hips high, head toward the floor between your hands.' },
  { id: 'band-ohp', name: 'Banded Overhead Press', pattern: 'vertical-push', kind: 'bodyweight', equipment: ['bands'], repRange: [12, 20], bwFactor: 0.2 },

  // ---- Shoulders (isolation) ----
  { id: 'db-lateral-raise', name: 'Dumbbell Lateral Raise', pattern: 'shoulders', kind: 'weighted', equipment: ['dumbbells'], repRange: [12, 20], startWeight: 10, increment: 5, cue: 'Lead with the elbows, no swing.' },
  { id: 'plate-raise', name: 'Plate Front Raise', pattern: 'shoulders', kind: 'weighted', equipment: ['plates'], repRange: [12, 15], startWeight: 10, increment: 5 },
  { id: 'band-pull-apart', name: 'Band Pull-Apart', pattern: 'shoulders', kind: 'bodyweight', equipment: ['bands'], repRange: [15, 25], bwFactor: 0.1, cue: 'Squeeze the shoulder blades together.' },

  // ---- Horizontal pull ----
  { id: 'bb-row', name: 'Barbell Row', pattern: 'horizontal-pull', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [6, 10], startWeight: 95, increment: 5, cue: 'Hinge to ~45°, pull to lower ribs, no body English.' },
  { id: 'pendlay-row', name: 'Pendlay Row', pattern: 'horizontal-pull', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [6, 8], startWeight: 95, increment: 5, cue: 'Back parallel to floor, bar dead-stops on the ground each rep.' },
  { id: 'db-row', name: 'One-Arm Dumbbell Row', pattern: 'horizontal-pull', kind: 'weighted', equipment: ['dumbbells', 'bench'], repRange: [8, 12], startWeight: 35, increment: 5, cue: 'Per arm. Knee and hand on the bench.' },
  { id: 'kb-row', name: 'Kettlebell Row', pattern: 'horizontal-pull', kind: 'weighted', equipment: ['kettlebell'], repRange: [8, 12], startWeight: 35, increment: 9 },
  { id: 'inverted-row', name: 'Inverted Row', pattern: 'horizontal-pull', kind: 'bodyweight', equipment: ['barbell', 'bench-rack'], repRange: [8, 15], bwFactor: 0.6, cue: 'Bar racked low, body straight, chest to bar.' },
  { id: 'ring-row', name: 'Ring Row', pattern: 'horizontal-pull', kind: 'bodyweight', equipment: ['rings'], repRange: [8, 15], bwFactor: 0.6 },
  { id: 'band-row', name: 'Banded Row', pattern: 'horizontal-pull', kind: 'bodyweight', equipment: ['bands'], repRange: [12, 20], bwFactor: 0.25 },
  { id: 'cable-row', name: 'Cable Row', pattern: 'horizontal-pull', kind: 'weighted', equipment: ['cable'], repRange: [10, 15], startWeight: 70, increment: 10 },

  // ---- Vertical pull ----
  { id: 'pullups', name: 'Pull-Ups', pattern: 'vertical-pull', kind: 'bodyweight', equipment: ['pullup-bar'], repRange: [4, 12], bwFactor: 1.0, cue: 'Dead hang to chin over bar. Add weight once 12 is easy.' },
  { id: 'chinups', name: 'Chin-Ups', pattern: 'vertical-pull', kind: 'bodyweight', equipment: ['pullup-bar'], repRange: [4, 12], bwFactor: 1.0, cue: 'Palms facing you — more biceps, same back.' },
  { id: 'weighted-pullups', name: 'Weighted Pull-Ups', pattern: 'vertical-pull', kind: 'weighted', equipment: ['pullup-bar', 'plates'], repRange: [4, 8], startWeight: 10, increment: 5, cue: 'Plate in a backpack or on a belt.' },
  { id: 'vest-pullups', name: 'Weight-Vest Pull-Ups', pattern: 'vertical-pull', kind: 'bodyweight', equipment: ['pullup-bar', 'weight-vest'], repRange: [4, 10], bwFactor: 1.15 },
  { id: 'ring-pullups', name: 'Ring Pull-Ups', pattern: 'vertical-pull', kind: 'bodyweight', equipment: ['rings'], repRange: [4, 10], bwFactor: 1.0 },
  { id: 'band-pulldown', name: 'Banded Pulldown', pattern: 'vertical-pull', kind: 'bodyweight', equipment: ['bands'], repRange: [12, 20], bwFactor: 0.25 },
  { id: 'cable-pulldown', name: 'Cable Pulldown', pattern: 'vertical-pull', kind: 'weighted', equipment: ['cable'], repRange: [10, 15], startWeight: 70, increment: 10 },

  // ---- Hinge ----
  { id: 'deadlift', name: 'Deadlift', pattern: 'hinge', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [4, 6], startWeight: 135, increment: 10, cue: 'Brace hard, push the floor away, lock out tall.' },
  { id: 'rdl', name: 'Romanian Deadlift', pattern: 'hinge', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [8, 10], startWeight: 95, increment: 10, cue: 'Soft knees, hips back until hamstrings load, stand up.' },
  { id: 'trap-bar-deadlift', name: 'Trap Bar Deadlift', pattern: 'hinge', kind: 'weighted', equipment: ['trap-bar', 'plates'], repRange: [5, 8], startWeight: 135, increment: 10, cue: 'Easier on the lower back than straight bar.' },
  { id: 'good-morning', name: 'Good Morning (light)', pattern: 'hinge', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [10, 12], startWeight: 45, increment: 5, cue: 'Bar on upper back, hinge slow, stay light.' },
  { id: 'kb-swing', name: 'Kettlebell Swing', pattern: 'hinge', kind: 'weighted', equipment: ['kettlebell'], repRange: [12, 20], startWeight: 35, increment: 9, met: 9, cue: 'Snap the hips, the arms are just ropes.' },
  { id: 'db-rdl', name: 'Dumbbell RDL', pattern: 'hinge', kind: 'weighted', equipment: ['dumbbells'], repRange: [10, 12], startWeight: 30, increment: 5 },

  // ---- Squat ----
  { id: 'back-squat', name: 'Barbell Back Squat', pattern: 'squat', kind: 'weighted', equipment: ['squat-rack', 'barbell', 'plates'], repRange: [5, 8], startWeight: 115, increment: 10, cue: 'Big breath, sit between your heels, drive up.' },
  { id: 'front-squat', name: 'Front Squat (clean grip)', pattern: 'squat', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [6, 8], startWeight: 75, increment: 5, cue: 'Clean the bar up, elbows high, sit between your heels.' },
  { id: 'goblet-squat', name: 'Goblet Squat', pattern: 'squat', kind: 'weighted', equipment: ['kettlebell'], repRange: [10, 15], startWeight: 35, increment: 9, cue: 'Bell at the chest, elbows inside the knees.' },
  { id: 'db-goblet-squat', name: 'Dumbbell Goblet Squat', pattern: 'squat', kind: 'weighted', equipment: ['dumbbells'], repRange: [10, 15], startWeight: 40, increment: 10 },
  { id: 'air-squats', name: 'Air Squats', pattern: 'squat', kind: 'bodyweight', equipment: ['bodyweight'], repRange: [15, 30], bwFactor: 0.64, cue: 'Full depth, chest up, fast but clean.' },

  // ---- Lunge ----
  { id: 'reverse-lunge', name: 'Barbell Reverse Lunge', pattern: 'lunge', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [8, 10], startWeight: 65, increment: 5, cue: 'Per leg. Step back, knee kisses the floor, drive through the front heel.' },
  { id: 'split-squat', name: 'Bulgarian Split Squat (rear foot on bench)', pattern: 'lunge', kind: 'weighted', equipment: ['barbell', 'bench', 'plates'], repRange: [8, 12], startWeight: 45, increment: 5, cue: 'Per leg. Rear foot up on the bench, torso tall.' },
  { id: 'db-lunge', name: 'Dumbbell Walking Lunge', pattern: 'lunge', kind: 'weighted', equipment: ['dumbbells'], repRange: [10, 12], startWeight: 25, increment: 5, cue: 'Per hand, per leg.' },
  { id: 'bw-lunge', name: 'Bodyweight Lunges', pattern: 'lunge', kind: 'bodyweight', equipment: ['bodyweight'], repRange: [12, 20], bwFactor: 0.64 },

  // ---- Glute ----
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', pattern: 'glute', kind: 'weighted', equipment: ['barbell', 'bench', 'plates'], repRange: [8, 12], startWeight: 95, increment: 10, cue: 'Upper back on the bench, squeeze hard at the top.' },
  { id: 'glute-bridge', name: 'Glute Bridge', pattern: 'glute', kind: 'bodyweight', equipment: ['bodyweight'], repRange: [15, 25], bwFactor: 0.45 },
  { id: 'kb-goblet-bridge', name: 'Weighted Glute Bridge (KB)', pattern: 'glute', kind: 'weighted', equipment: ['kettlebell'], repRange: [12, 15], startWeight: 35, increment: 9 },

  // ---- Calves ----
  { id: 'calf-raise', name: 'Standing Barbell Calf Raise', pattern: 'calves', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [12, 15], startWeight: 95, increment: 10, cue: 'Pause at the top, full stretch at the bottom.' },
  { id: 'db-calf-raise', name: 'Dumbbell Calf Raise', pattern: 'calves', kind: 'weighted', equipment: ['dumbbells'], repRange: [15, 20], startWeight: 40, increment: 10 },
  { id: 'bw-calf-raise', name: 'Single-Leg Calf Raise', pattern: 'calves', kind: 'bodyweight', equipment: ['bodyweight'], repRange: [15, 25], bwFactor: 0.9 },

  // ---- Arms ----
  { id: 'ez-curl', name: 'EZ-Bar Curl', pattern: 'arms', kind: 'weighted', equipment: ['ez-bar', 'plates'], repRange: [8, 12], startWeight: 40, increment: 5, cue: 'Elbows pinned to your sides.' },
  { id: 'bb-curl', name: 'Barbell Curl', pattern: 'arms', kind: 'weighted', equipment: ['barbell', 'plates'], repRange: [8, 12], startWeight: 45, increment: 5 },
  { id: 'db-curl', name: 'Dumbbell Curl', pattern: 'arms', kind: 'weighted', equipment: ['dumbbells'], repRange: [10, 15], startWeight: 20, increment: 5, cue: 'Per hand.' },
  { id: 'hammer-curl', name: 'Hammer Curl', pattern: 'arms', kind: 'weighted', equipment: ['dumbbells'], repRange: [10, 15], startWeight: 20, increment: 5 },
  { id: 'skull-crushers', name: 'EZ-Bar Skull Crushers', pattern: 'arms', kind: 'weighted', equipment: ['ez-bar', 'bench', 'plates'], repRange: [8, 12], startWeight: 40, increment: 5, cue: 'Lower to the forehead, elbows still.' },
  { id: 'db-overhead-ext', name: 'DB Overhead Triceps Extension', pattern: 'arms', kind: 'weighted', equipment: ['dumbbells'], repRange: [10, 15], startWeight: 25, increment: 5 },
  { id: 'bench-dips', name: 'Bench Dips', pattern: 'arms', kind: 'bodyweight', equipment: ['bench'], repRange: [10, 20], bwFactor: 0.5 },
  { id: 'band-curl', name: 'Banded Curl', pattern: 'arms', kind: 'bodyweight', equipment: ['bands'], repRange: [15, 25], bwFactor: 0.15 },
  { id: 'cable-pushdown', name: 'Cable Pushdown', pattern: 'arms', kind: 'weighted', equipment: ['cable'], repRange: [10, 15], startWeight: 40, increment: 10 },

  // ---- Core ----
  { id: 'hanging-knee-raise', name: 'Hanging Knee Raise', pattern: 'core', kind: 'bodyweight', equipment: ['pullup-bar'], repRange: [10, 15], bwFactor: 0.3, cue: 'No swing — curl the hips up.' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', pattern: 'core', kind: 'bodyweight', equipment: ['pullup-bar'], repRange: [8, 12], bwFactor: 0.35, cue: 'Straight legs to parallel or higher.' },
  { id: 'plank', name: 'Plank', pattern: 'core', kind: 'timed', equipment: ['bodyweight'], seconds: 45, met: 3.5, cue: 'Glutes tight, ribs down.' },
  { id: 'side-plank', name: 'Side Plank', pattern: 'core', kind: 'timed', equipment: ['bodyweight'], seconds: 30, met: 3.5, cue: 'Per side.' },
  { id: 'situps', name: 'Sit-Ups', pattern: 'core', kind: 'bodyweight', equipment: ['bodyweight'], repRange: [15, 30], bwFactor: 0.25 },
  { id: 'mb-slam', name: 'Medicine Ball Slam', pattern: 'core', kind: 'weighted', equipment: ['medicine-ball'], repRange: [10, 15], startWeight: 12, increment: 4, met: 8 },
  { id: 'kb-carry', name: 'Kettlebell Farmer Carry', pattern: 'core', kind: 'timed', equipment: ['kettlebell'], seconds: 45, met: 5, cue: 'Tall posture, crush grip, walk.' },

  // ---- Conditioning (structured intervals) ----
  { id: 'hill-sprints', name: 'Hill Sprints', pattern: 'conditioning', kind: 'intervals', equipment: ['hill'], rounds: 6, workSeconds: 15, restSeconds: 105, met: 12, cue: 'Sprint up hard, walk down to recover. Quality over quantity.' },
  { id: 'bike-sprints', name: 'Wind Bike Sprints', pattern: 'conditioning', kind: 'intervals', equipment: ['bike'], rounds: 6, workSeconds: 20, restSeconds: 100, met: 11, cue: 'All-out effort, easy spin to recover.' },
  { id: 'row-sprints', name: 'Rower Sprints', pattern: 'conditioning', kind: 'intervals', equipment: ['rower'], rounds: 6, workSeconds: 30, restSeconds: 90, met: 10 },
  { id: 'jump-rope-intervals', name: 'Jump Rope Intervals', pattern: 'conditioning', kind: 'intervals', equipment: ['jump-rope'], rounds: 8, workSeconds: 45, restSeconds: 45, met: 11 },
  { id: 'sled-pushes', name: 'Sled Pushes', pattern: 'conditioning', kind: 'intervals', equipment: ['sled'], rounds: 6, workSeconds: 20, restSeconds: 100, met: 10 },
  { id: 'bike-steady', name: 'Wind Bike — Steady State', pattern: 'conditioning', kind: 'timed', equipment: ['bike'], seconds: 1200, met: 7, cue: 'Conversational pace, 20 minutes.' },
  { id: 'row-steady', name: 'Rower — Steady State', pattern: 'conditioning', kind: 'timed', equipment: ['rower'], seconds: 1200, met: 7 },

  // ---- Activities (logged by distance or duration) ----
  { id: 'run', name: 'Run', pattern: 'activity', kind: 'activity', equipment: ['bodyweight'], unit: 'miles', defaultQuantity: 1, met: 9.8, cue: 'Logged by distance.' },
  { id: 'walk', name: 'Walk', pattern: 'activity', kind: 'activity', equipment: ['bodyweight'], unit: 'miles', defaultQuantity: 2, met: 3.5 },
  { id: 'ruck', name: 'Ruck (weighted walk)', pattern: 'activity', kind: 'activity', equipment: ['weight-vest'], unit: 'miles', defaultQuantity: 2, met: 5.5 },
  { id: 'hike', name: 'Hike', pattern: 'activity', kind: 'activity', equipment: ['bodyweight'], unit: 'minutes', defaultQuantity: 60, met: 6 },
  { id: 'swim', name: 'Swim', pattern: 'activity', kind: 'activity', equipment: ['bodyweight'], unit: 'minutes', defaultQuantity: 30, met: 7 },
  { id: 'bike-ride', name: 'Bike Ride', pattern: 'activity', kind: 'activity', equipment: ['bodyweight'], unit: 'minutes', defaultQuantity: 45, met: 7 },
  { id: 'gardening', name: 'Gardening', pattern: 'activity', kind: 'activity', equipment: ['bodyweight'], unit: 'minutes', defaultQuantity: 45, met: 3.8 },
  { id: 'yard-work', name: 'Yard Work', pattern: 'activity', kind: 'activity', equipment: ['bodyweight'], unit: 'minutes', defaultQuantity: 45, met: 4.5 },
  { id: 'mobility', name: 'Mobility / Stretching', pattern: 'activity', kind: 'activity', equipment: ['bodyweight'], unit: 'minutes', defaultQuantity: 20, met: 2.5 },
  { id: 'sports', name: 'Sports / Pickup Game', pattern: 'activity', kind: 'activity', equipment: ['bodyweight'], unit: 'minutes', defaultQuantity: 60, met: 7 },
  { id: 'other-activity', name: 'Other Activity', pattern: 'activity', kind: 'activity', equipment: ['bodyweight'], unit: 'minutes', defaultQuantity: 30, met: 4 },
]
