import { useState } from 'react'
import { db, today } from '../db'
import { DEFAULT_EQUIPMENT } from '../data/exercises'
import { loadLibrary } from '../data/library'
import { ensureSchedule } from '../engine/scheduler'
import type { Profile } from '../types'

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState<'lb' | 'kg'>('lb')
  const [days, setDays] = useState<5 | 6>(6)
  const [hasSaunaAccess, setHasSaunaAccess] = useState(true)
  const [sauna, setSauna] = useState(15)
  const [hour, setHour] = useState(7)
  const [saving, setSaving] = useState(false)

  const valid = name.trim().length > 0 && Number(weight) > 0

  async function start() {
    if (!valid || saving) return
    setSaving(true)
    const profile: Profile = {
      id: 'me',
      name: name.trim(),
      unit,
      daysPerWeek: days,
      saunaMinutes: sauna,
      notifyHour: hour,
      programStart: today(),
      createdAt: new Date().toISOString(),
      equipment: hasSaunaAccess ? [...DEFAULT_EQUIPMENT] : DEFAULT_EQUIPMENT.filter((e) => e !== 'sauna'),
    }
    await db.profile.put(profile)
    await db.metrics.add({ date: today(), weight: Number(weight) })
    await loadLibrary()
    await ensureSchedule(profile)
    onDone()
  }

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="card-hero" style={{ marginTop: 24 }}>
          <div className="eyebrow">bazalt</div>
          <div className="hero-title">Show up. Log it. Progress.</div>
          <div className="hero-sub">
            Training built around your equipment, one day at a time. Everything stays on this phone.
          </div>
        </div>

        <div className="card">
          <div className="field">
            <label>Your name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" />
          </div>
          <div className="field">
            <label>Current body weight</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="input"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={unit === 'lb' ? 'e.g. 185' : 'e.g. 84'}
              />
              <div className="seg" style={{ width: 130 }}>
                <button className={unit === 'lb' ? 'on' : ''} onClick={() => setUnit('lb')}>lb</button>
                <button className={unit === 'kg' ? 'on' : ''} onClick={() => setUnit('kg')}>kg</button>
              </div>
            </div>
          </div>
          <div className="field">
            <label>Training days per week</label>
            <div className="seg">
              <button className={days === 5 ? 'on' : ''} onClick={() => setDays(5)}>5 days</button>
              <button className={days === 6 ? 'on' : ''} onClick={() => setDays(6)}>6 days</button>
            </div>
          </div>
          <div className="field">
            <label>Do you have access to a dry sauna?</label>
            <div className="seg">
              <button className={hasSaunaAccess ? 'on' : ''} onClick={() => setHasSaunaAccess(true)}>Yes</button>
              <button className={!hasSaunaAccess ? 'on' : ''} onClick={() => setHasSaunaAccess(false)}>No</button>
            </div>
          </div>
          {hasSaunaAccess && (
            <div className="field">
              <label>Sauna session length: {sauna} min</label>
              <input type="range" min={10} max={30} step={5} value={sauna} onChange={(e) => setSauna(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
          )}
          <div className="field">
            <label>Preferred workout reminder time</label>
            <select className="input" value={hour} onChange={(e) => setHour(Number(e.target.value))}>
              {Array.from({ length: 18 }, (_, i) => i + 4).map((h) => (
                <option key={h} value={h}>
                  {h === 0 ? '12' : h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn btn-primary" disabled={!valid || saving} onClick={start}>
          Build my program
        </button>
        <p className="tiny" style={{ textAlign: 'center', marginTop: 12 }}>
          No account, no cloud, no tracking — your data never leaves this device.
        </p>
      </div>
    </div>
  )
}
