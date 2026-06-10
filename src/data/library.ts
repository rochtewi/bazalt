import { db } from '../db'
import { DEFAULT_EQUIPMENT, EXERCISES } from './exercises'
import type { Equipment, ExerciseDef } from '../types'

/**
 * Runtime exercise library: built-ins merged with user-created exercises,
 * filtered by owned equipment where relevant. Call loadLibrary() once on
 * app start (and after creating/deleting a custom exercise).
 */
let customExercises: ExerciseDef[] = []
let ownedEquipment: Equipment[] = [...DEFAULT_EQUIPMENT]

export async function loadLibrary(): Promise<void> {
  customExercises = await db.customExercises.toArray()
  const profile = await db.profile.get('me')
  ownedEquipment = profile?.equipment?.length ? profile.equipment : [...DEFAULT_EQUIPMENT]
  if (!ownedEquipment.includes('bodyweight')) ownedEquipment.push('bodyweight')
}

export function owned(): Equipment[] {
  return ownedEquipment
}

export function allExercises(): ExerciseDef[] {
  return [...EXERCISES, ...customExercises]
}

export function defFor(id: string): ExerciseDef {
  const def = allExercises().find((e) => e.id === id)
  if (def) return def
  // An exercise referenced by an old log may have been deleted — degrade gracefully.
  return { id, name: id, pattern: 'conditioning', kind: 'bodyweight', equipment: ['bodyweight'], repRange: [8, 12] }
}

export function canDo(def: ExerciseDef): boolean {
  return def.equipment.every((q) => ownedEquipment.includes(q))
}

/** Exercises usable with the owned equipment (for builders and swap pickers). */
export function availableExercises(): ExerciseDef[] {
  return allExercises().filter(canDo)
}

/** Same-pattern alternatives doable with owned equipment. */
export function swapsFor(exerciseId: string): ExerciseDef[] {
  const def = defFor(exerciseId)
  return availableExercises().filter((e) => e.id !== exerciseId && e.pattern === def.pattern)
}
