import { db } from './db'

/**
 * Full-database backup and restore. Protects against the things local-first
 * can't survive on its own: reinstalls, new phones, and URL moves (iOS gives
 * each home-screen app an isolated storage container).
 */

interface Backup {
  app: 'bazalt'
  version: 1
  exportedAt: string
  tables: Record<string, unknown[]>
}

const TABLES = ['profile', 'metrics', 'schedule', 'exerciseState', 'meta', 'customExercises', 'customWorkouts', 'healthEvents'] as const

export async function exportBackup(): Promise<string> {
  const tables: Record<string, unknown[]> = {}
  for (const name of TABLES) {
    tables[name] = await db.table(name).toArray()
  }
  const backup: Backup = { app: 'bazalt', version: 1, exportedAt: new Date().toISOString(), tables }
  return JSON.stringify(backup)
}

export function downloadBackup(json: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bazalt-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Replaces everything on this device with the backup's contents. */
export async function importBackup(raw: string): Promise<void> {
  let parsed: Backup
  try {
    parsed = JSON.parse(raw.trim())
  } catch {
    throw new Error('That does not look like a bazalt backup (not valid JSON).')
  }
  if (parsed.app !== 'bazalt' || !parsed.tables || typeof parsed.tables !== 'object') {
    throw new Error('That does not look like a bazalt backup.')
  }
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const name of TABLES) {
      const rows = parsed.tables[name]
      await db.table(name).clear()
      if (Array.isArray(rows) && rows.length) await db.table(name).bulkPut(rows)
    }
  })
}
