import type { ExerciseDef, Gear } from '../types'

/**
 * Achievable-load engine. Every prescribed weight must be buildable from the
 * gear the user actually owns: barbell loads come from the bar plus symmetric
 * plate pairs, dumbbell/kettlebell moves snap to owned bells, and plate-held
 * moves (weighted sit-ups, backpack pull-ups) use one or two loose plates.
 * Call initGear() on app start and whenever the inventory changes.
 */

export const DEFAULT_GEAR: Gear = {
  barWeight: 45,
  ezBarWeight: 25,
  // A common 300 lb starter set. The user corrects this in Profile.
  platePairs: { '45': 2, '35': 1, '25': 1, '10': 2, '5': 1, '2.5': 1 },
  dumbbells: [],
  kettlebells: [],
}

let gear: Gear = DEFAULT_GEAR
let barbellCache: number[] | null = null
let plateHeldCache: number[] | null = null

export function initGear(g?: Gear): void {
  gear = g ?? DEFAULT_GEAR
  barbellCache = null
  plateHeldCache = null
}

export function currentGear(): Gear {
  return gear
}

function pairEntries(platePairs: Record<string, number>): { weight: number; pairs: number }[] {
  return Object.entries(platePairs)
    .map(([w, n]) => ({ weight: Number(w), pairs: Math.max(0, Math.floor(n)) }))
    .filter((p) => p.weight > 0 && p.pairs > 0)
}

/** Every total barbell load buildable: bar + symmetric plate pairs. Pure — usable for UI previews. */
export function achievableBarbellLoads(barWeight: number, platePairs: Record<string, number>): number[] {
  let sums = new Set<number>([0])
  for (const { weight, pairs } of pairEntries(platePairs)) {
    const next = new Set<number>()
    for (const s of sums) {
      for (let k = 0; k <= pairs; k++) next.add(s + k * weight * 2)
    }
    sums = next
  }
  return [...sums].sort((a, b) => a - b).map((p) => barWeight + p)
}

/** Plate totals only (no bar), used for the EZ bar which has its own weight. */
function barbellLoads(): number[] {
  barbellCache ??= achievableBarbellLoads(0, gear.platePairs)
  return barbellCache
}

/** Loads for holding loose plates: any one or two owned plates. */
function plateHeldLoads(): number[] {
  if (!plateHeldCache) {
    const singles: number[] = []
    for (const { weight, pairs } of pairEntries(gear.platePairs)) {
      for (let i = 0; i < pairs * 2; i++) singles.push(weight)
    }
    const set = new Set<number>()
    for (let i = 0; i < singles.length; i++) {
      set.add(singles[i])
      for (let j = i + 1; j < singles.length; j++) set.add(singles[i] + singles[j])
    }
    plateHeldCache = [...set].sort((a, b) => a - b)
  }
  return plateHeldCache
}

/**
 * The loads this exercise can actually be performed at, sorted ascending.
 * Returns null when the movement isn't constrained by the inventory
 * (machines, bands, unknown custom gear) — those keep simple 5-unit steps.
 */
export function loadsFor(def: ExerciseDef): number[] | null {
  const eq = def.equipment
  if (eq.includes('barbell') || eq.includes('ez-bar')) {
    const bar = eq.includes('barbell') ? gear.barWeight : gear.ezBarWeight
    return barbellLoads().map((p) => bar + p)
  }
  if (eq.includes('dumbbells')) return gear.dumbbells.length ? [...gear.dumbbells].sort((a, b) => a - b) : null
  if (eq.includes('kettlebell')) return gear.kettlebells.length ? [...gear.kettlebells].sort((a, b) => a - b) : null
  if (eq.includes('plates')) {
    const loads = plateHeldLoads()
    return loads.length ? loads : null
  }
  return null
}

function round5(n: number): number {
  return Math.max(5, Math.round(n / 5) * 5)
}

/**
 * Snap a target to an achievable load, never jumping heavier than earned:
 * the heaviest achievable load at or below the target, or the lightest
 * available when even that doesn't exist.
 */
export function snapLoad(def: ExerciseDef, target: number): number {
  const loads = loadsFor(def)
  if (!loads || loads.length === 0) return round5(target)
  const below = loads.filter((l) => l <= target)
  return below.length ? below[below.length - 1] : loads[0]
}

/**
 * The next heavier achievable load once progression earns an increase.
 * Aims for current + increment, settles for the closest achievable step up;
 * returns current unchanged when the inventory is maxed out.
 */
export function nextLoadUp(def: ExerciseDef, current: number): number {
  const increment = def.increment ?? 5
  const loads = loadsFor(def)
  if (!loads || loads.length === 0) return current + increment
  const up = loads.filter((l) => l > current)
  if (up.length === 0) return current
  const desired = current + increment
  const atOrAbove = up.find((l) => l >= desired)
  return atOrAbove ?? up[up.length - 1]
}
