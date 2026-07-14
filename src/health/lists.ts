import { db, getMeta, setMeta } from '../db'
import type { HealthListItem } from '../types'

/**
 * Editable logging vocabularies for the Health tab. Stored in meta as JSON so
 * the user can add/rename/archive without a schema change. Archived items are
 * hidden from the tap grids but stay resolvable for old events.
 *
 * Meal categories are single INGREDIENTS (onion and garlic separate, beef not
 * "red meat") because ingredients are what get correlated against symptoms.
 * Quick-pick meals below pre-select ingredient sets — the saved data is
 * always ingredients.
 */

export const DEFAULT_MEAL_CATEGORIES: HealthListItem[] = [
  { id: 'beef', label: 'Beef' },
  { id: 'pork', label: 'Pork / bacon' },
  { id: 'chicken', label: 'Chicken' },
  { id: 'turkey', label: 'Turkey' },
  { id: 'fish_seafood', label: 'Fish / seafood' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'onion', label: 'Onion' },
  { id: 'garlic', label: 'Garlic' },
  { id: 'peppers', label: 'Peppers' },
  { id: 'tomato', label: 'Tomato' },
  { id: 'cruciferous', label: 'Broccoli / cabbage' },
  { id: 'leafy_greens', label: 'Leafy greens' },
  { id: 'other_veg', label: 'Other veg' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'bread_wheat', label: 'Bread / wheat' },
  { id: 'rice', label: 'Rice' },
  { id: 'corn', label: 'Corn' },
  { id: 'beans_legumes', label: 'Beans / legumes' },
  { id: 'nuts_seeds', label: 'Nuts / seeds' },
  { id: 'fermented_preserved', label: 'Fermented / preserved' },
  { id: 'fried_high_fat', label: 'Fried / high-fat' },
  { id: 'spicy', label: 'Spicy' },
  { id: 'processed_packaged', label: 'Processed / packaged' },
  { id: 'alcohol', label: 'Alcohol' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'sweets', label: 'Sweets' },
]

export const DEFAULT_SYMPTOMS: HealthListItem[] = [
  { id: 'bloating', label: 'Bloating' },
  { id: 'gas_pain', label: 'Gas pain' },
  { id: 'loose_stool', label: 'Loose stool' },
  { id: 'constipation', label: 'Constipation' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'heartburn', label: 'Heartburn' },
  { id: 'headache', label: 'Headache' },
  { id: 'brain_fog', label: 'Brain fog' },
  { id: 'eye_focus', label: 'Eye focus' },
  { id: 'skin_burning', label: 'Skin burning' },
  { id: 'skin_rash', label: 'Skin rash / itch' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'joint_ache', label: 'Joint ache' },
  { id: 'muscle_soreness', label: 'Unusual soreness' },
  { id: 'poor_sleep', label: 'Poor sleep' },
]

/** Common meals — tapping one pre-selects its ingredients (still editable before save). */
export interface MealPreset {
  id: string
  label: string
  categories: string[]
}

export const DEFAULT_MEAL_PRESETS: MealPreset[] = [
  { id: 'pizza', label: 'Pizza', categories: ['bread_wheat', 'dairy', 'tomato', 'processed_packaged'] },
  { id: 'burger', label: 'Burger', categories: ['beef', 'bread_wheat', 'dairy', 'onion'] },
  { id: 'tacos', label: 'Tacos', categories: ['beef', 'corn', 'dairy', 'tomato', 'onion', 'spicy'] },
  { id: 'pasta', label: 'Pasta', categories: ['bread_wheat', 'tomato', 'garlic', 'dairy'] },
  { id: 'sandwich', label: 'Deli sandwich', categories: ['bread_wheat', 'processed_packaged', 'dairy'] },
  { id: 'salad', label: 'Salad', categories: ['leafy_greens', 'other_veg', 'tomato', 'onion'] },
  { id: 'breakfast', label: 'Eggs & bacon', categories: ['eggs', 'pork', 'bread_wheat'] },
  { id: 'wings', label: 'Wings', categories: ['chicken', 'fried_high_fat', 'spicy'] },
  { id: 'burrito', label: 'Burrito bowl', categories: ['beef', 'beans_legumes', 'rice', 'dairy', 'tomato'] },
  { id: 'stir_fry', label: 'Stir-fry', categories: ['chicken', 'rice', 'other_veg', 'garlic', 'onion'] },
]

/** Symptoms that get the optional body-location field. */
export const LOCATION_SYMPTOMS = new Set(['skin_burning', 'skin_rash', 'joint_ache'])

export interface HealthLists {
  meals: HealthListItem[]
  symptoms: HealthListItem[]
  presets: MealPreset[]
}

const LISTS_VERSION = '2'
let cache: HealthLists | null = null

export async function loadHealthLists(): Promise<HealthLists> {
  if (cache) return cache
  const raw = await getMeta('healthLists')
  const ver = await getMeta('healthListsVersion')

  if (raw && ver === LISTS_VERSION) {
    try {
      cache = JSON.parse(raw) as HealthLists
      cache.presets ??= DEFAULT_MEAL_PRESETS
      return cache
    } catch {
      // fall through to rebuild
    }
  }

  const fresh: HealthLists = {
    meals: [...DEFAULT_MEAL_CATEGORIES],
    symptoms: [...DEFAULT_SYMPTOMS],
    presets: [...DEFAULT_MEAL_PRESETS],
  }

  // v1 -> v2: the meal list moved to single ingredients. Any old category
  // that real events reference (red_meat, alliums, ...) is kept but archived,
  // so history and exports still resolve while the tap grid shows the new list.
  if (raw) {
    try {
      const old = JSON.parse(raw) as HealthLists
      const events = await db.healthEvents.toArray()
      const usedMeals = new Set(events.flatMap((e) => e.meal?.categories ?? []))
      const usedSymptoms = new Set(events.map((e) => e.symptom?.symptom).filter(Boolean))
      const mealIds = new Set(fresh.meals.map((m) => m.id))
      const symptomIds = new Set(fresh.symptoms.map((s) => s.id))
      for (const m of old.meals ?? []) {
        if (!mealIds.has(m.id) && usedMeals.has(m.id)) fresh.meals.push({ ...m, archived: true })
      }
      for (const s of old.symptoms ?? []) {
        if (!symptomIds.has(s.id) && usedSymptoms.has(s.id)) fresh.symptoms.push({ ...s, archived: true })
      }
    } catch {
      // old data unreadable — fresh defaults are fine
    }
  }

  cache = fresh
  await setMeta('healthLists', JSON.stringify(fresh))
  await setMeta('healthListsVersion', LISTS_VERSION)
  return fresh
}

export async function saveHealthLists(lists: HealthLists): Promise<void> {
  cache = lists
  await setMeta('healthLists', JSON.stringify(lists))
  await setMeta('healthListsVersion', LISTS_VERSION)
}

/** Resolve an id to its label, falling back to the id for archived/unknown items. */
export function labelFor(lists: HealthListItem[], id: string): string {
  return lists.find((x) => x.id === id)?.label ?? id.replace(/_/g, ' ')
}
