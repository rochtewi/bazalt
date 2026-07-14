import { getMeta, setMeta } from '../db'
import type { HealthListItem } from '../types'

/**
 * Editable logging vocabularies for the Health tab. Stored in meta as JSON so
 * the user can add/rename/archive without a schema change. Archived items are
 * hidden from the tap grids but stay resolvable for old events.
 */

export const DEFAULT_MEAL_CATEGORIES: HealthListItem[] = [
  { id: 'red_meat', label: 'Red meat' },
  { id: 'poultry', label: 'Poultry' },
  { id: 'pork', label: 'Pork' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'alliums', label: 'Onion / garlic' },
  { id: 'cruciferous', label: 'Cabbage / broccoli' },
  { id: 'other_veg', label: 'Other veg' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'grains_bread', label: 'Grains / bread' },
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

/** Symptoms that get the optional body-location field. */
export const LOCATION_SYMPTOMS = new Set(['skin_burning', 'skin_rash', 'joint_ache'])

export interface HealthLists {
  meals: HealthListItem[]
  symptoms: HealthListItem[]
}

let cache: HealthLists | null = null

export async function loadHealthLists(): Promise<HealthLists> {
  if (cache) return cache
  const raw = await getMeta('healthLists')
  if (raw) {
    try {
      cache = JSON.parse(raw) as HealthLists
      return cache
    } catch {
      // fall through to defaults
    }
  }
  cache = { meals: DEFAULT_MEAL_CATEGORIES, symptoms: DEFAULT_SYMPTOMS }
  await setMeta('healthLists', JSON.stringify(cache))
  return cache
}

export async function saveHealthLists(lists: HealthLists): Promise<void> {
  cache = lists
  await setMeta('healthLists', JSON.stringify(lists))
}

/** Resolve an id to its label, falling back to the id for archived/unknown items. */
export function labelFor(lists: HealthListItem[], id: string): string {
  return lists.find((x) => x.id === id)?.label ?? id.replace(/_/g, ' ')
}
