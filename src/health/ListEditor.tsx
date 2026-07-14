import { useState } from 'react'
import Sheet from '../components/Sheet'
import { saveHealthLists, type HealthLists } from './lists'
import type { HealthListItem } from '../types'

/**
 * Add / rename / archive the logging vocabularies. Archiving hides an item
 * from the tap grids; it never deletes — old events keep resolving. Renames
 * keep the id, so history and exports stay consistent.
 */
export default function ListEditor({ lists, onChanged, onClose }: {
  lists: HealthLists
  onChanged: (l: HealthLists) => void
  onClose: () => void
}) {
  const [which, setWhich] = useState<'meals' | 'symptoms'>('meals')
  const [newLabel, setNewLabel] = useState('')
  const items = lists[which]

  async function update(next: HealthListItem[]) {
    const updated = { ...lists, [which]: next }
    await saveHealthLists(updated)
    onChanged(updated)
  }

  async function add() {
    const label = newLabel.trim()
    if (!label) return
    const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'item'
    let id = base
    let n = 2
    while (items.some((x) => x.id === id)) id = `${base}_${n++}`
    await update([...items, { id, label }])
    setNewLabel('')
  }

  async function rename(id: string, label: string) {
    await update(items.map((x) => (x.id === id ? { ...x, label } : x)))
  }

  async function toggleArchive(id: string) {
    await update(items.map((x) => (x.id === id ? { ...x, archived: !x.archived } : x)))
  }

  const active = items.filter((x) => !x.archived)
  const archived = items.filter((x) => x.archived)

  return (
    <Sheet title="Customize lists" onClose={onClose}>
      <div className="seg" style={{ marginBottom: 12 }}>
        <button className={which === 'meals' ? 'on' : ''} onClick={() => setWhich('meals')}>Ingredients</button>
        <button className={which === 'symptoms' ? 'on' : ''} onClick={() => setWhich('symptoms')}>Symptoms</button>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <input
          className="input"
          placeholder={which === 'meals' ? 'e.g. Shellfish' : 'e.g. Dizziness'}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <button className="btn btn-sm btn-primary" onClick={add} disabled={!newLabel.trim()}>Add</button>
      </div>

      {active.map((x) => (
        <div className="row" key={x.id} style={{ padding: '4px 0', gap: 8 }}>
          <input
            className="input"
            style={{ padding: '9px 12px', fontSize: 14 }}
            value={x.label}
            onChange={(e) => rename(x.id, e.target.value)}
          />
          <button className="btn btn-sm btn-secondary" onClick={() => toggleArchive(x.id)}>Hide</button>
        </div>
      ))}

      {archived.length > 0 && (
        <>
          <div className="tiny" style={{ fontWeight: 700, margin: '12px 0 4px' }}>HIDDEN (old logs still show them)</div>
          {archived.map((x) => (
            <div className="row" key={x.id} style={{ padding: '4px 0', gap: 8 }}>
              <span className="muted" style={{ fontSize: 14 }}>{x.label}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => toggleArchive(x.id)}>Restore</button>
            </div>
          ))}
        </>
      )}
    </Sheet>
  )
}
