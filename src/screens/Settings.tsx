import { useEffect, useState } from 'react'
import { db } from '../db'
import { buildICS, currentSubscription, downloadICS, isStandalone, pushSupported, subscribeToPush } from '../notifications'
import { useToast } from '../components/useToast'
import type { Profile } from '../types'

export default function SettingsScreen({ profile, onProfileChange }: { profile: Profile; onProfileChange: () => void }) {
  const [name, setName] = useState(profile.name)
  const [unit, setUnit] = useState(profile.unit)
  const [days, setDays] = useState<5 | 6>(profile.daysPerWeek)
  const [sauna, setSauna] = useState(profile.saunaMinutes)
  const [hour, setHour] = useState(profile.notifyHour)
  const [sub, setSub] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [toast, showToast] = useToast()

  useEffect(() => {
    currentSubscription().then(setSub).catch(() => setSub(null))
  }, [])

  async function save() {
    await db.profile.update('me', { name: name.trim() || profile.name, unit, daysPerWeek: days, saunaMinutes: sauna, notifyHour: hour })
    onProfileChange()
    showToast('Profile saved')
  }

  async function enablePush() {
    setBusy(true)
    try {
      const s = await subscribeToPush()
      setSub(s)
      showToast('Notifications enabled on this phone!')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not enable notifications')
    } finally {
      setBusy(false)
    }
  }

  async function copySub() {
    if (!sub) return
    await navigator.clipboard.writeText(sub)
    showToast('Copied — paste it into the GitHub secret')
  }

  async function exportCal() {
    const p = (await db.profile.get('me'))!
    downloadICS(await buildICS(p))
    showToast('Calendar file downloaded')
  }

  async function resetAll() {
    await db.delete()
    window.location.reload()
  }

  return (
    <div className="screen">
      <div className="screen-title">Profile</div>
      <div className="screen-sub">Your setup, your data — stored only on this device</div>

      <div className="card">
        <div className="field">
          <label>Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Units</label>
          <div className="seg">
            <button className={unit === 'lb' ? 'on' : ''} onClick={() => setUnit('lb')}>lb</button>
            <button className={unit === 'kg' ? 'on' : ''} onClick={() => setUnit('kg')}>kg</button>
          </div>
        </div>
        <div className="field">
          <label>Training days per week</label>
          <div className="seg">
            <button className={days === 5 ? 'on' : ''} onClick={() => setDays(5)}>5 days</button>
            <button className={days === 6 ? 'on' : ''} onClick={() => setDays(6)}>6 days</button>
          </div>
          <p className="tiny" style={{ marginTop: 6 }}>Applies to newly scheduled weeks.</p>
        </div>
        <div className="field">
          <label>Sauna session: {sauna} min</label>
          <input type="range" min={10} max={30} step={5} value={sauna} onChange={(e) => setSauna(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div className="field">
          <label>Reminder time (used for calendar export)</label>
          <select className="input" value={hour} onChange={(e) => setHour(Number(e.target.value))}>
            {Array.from({ length: 18 }, (_, i) => i + 4).map((h) => (
              <option key={h} value={h}>{h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={save}>Save profile</button>
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Daily workout notification</div>
        {!pushSupported() && !isStandalone() && (
          <p className="muted">
            To get notifications on iPhone: open this app in Safari, tap <b>Share → Add to Home Screen</b>, then
            launch it from the home screen icon and come back here.
          </p>
        )}
        {pushSupported() && (
          <>
            {!sub ? (
              <>
                <p className="muted" style={{ marginBottom: 10 }}>
                  Enables a morning push with the day's workout, sent by your own GitHub repository — no
                  third-party service.
                </p>
                <button className="btn btn-primary" disabled={busy} onClick={enablePush}>
                  Enable notifications
                </button>
              </>
            ) : (
              <>
                <p className="muted" style={{ marginBottom: 8 }}>
                  ✅ Enabled on this phone. Final step: copy this subscription and add it as the
                  <b> PUSH_SUBSCRIPTION</b> secret in your GitHub repository (Settings → Secrets → Actions).
                </p>
                <div className="code-box">{sub}</div>
                <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={copySub}>
                  Copy subscription
                </button>
              </>
            )}
          </>
        )}
        <div className="divider" />
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Calendar reminders (offline fallback)</div>
        <p className="muted" style={{ marginBottom: 10 }}>
          Export the next 4 weeks as a calendar file. Open it on your iPhone to add native alerts to Apple
          Calendar — works with zero internet.
        </p>
        <button className="btn btn-secondary" onClick={exportCal}>Export 4-week calendar (.ics)</button>
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Privacy & security</div>
        <p className="tiny">
          Forge has no server, no account, and no analytics. Workouts, weight history, and your profile live in
          this device's local database only. Deleting the app deletes the data.
        </p>
        <div className="divider" />
        {!confirmReset ? (
          <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>Reset all data…</button>
        ) : (
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setConfirmReset(false)}>Keep my data</button>
            <button className="btn btn-danger" onClick={resetAll}>Yes, erase everything</button>
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
