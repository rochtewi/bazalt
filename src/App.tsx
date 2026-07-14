import { useCallback, useEffect, useState } from 'react'
import { db, seedPresets } from './db'
import { loadLibrary } from './data/library'
import { ensureSchedule, migrateTemplates } from './engine/scheduler'
import { DEFAULT_GEAR, initGear } from './engine/loads'
import type { Profile } from './types'
import Onboarding from './screens/Onboarding'
import TodayScreen from './screens/Today'
import CalendarScreen from './screens/CalendarScreen'
import ProgressScreen from './screens/Progress'
import SettingsScreen from './screens/Settings'

type Tab = 'today' | 'calendar' | 'progress' | 'settings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'progress', label: 'Progress' },
  { id: 'settings', label: 'Profile' },
]

export default function App() {
  // undefined = loading, null = needs onboarding
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)
  const [tab, setTab] = useState<Tab>('today')

  const load = useCallback(async () => {
    await loadLibrary()
    await seedPresets()
    let p = await db.profile.get('me')
    if (p) {
      if (!p.gear) {
        // Existing installs get the default inventory; edited in Profile.
        await db.profile.update('me', { gear: DEFAULT_GEAR })
        p = { ...p, gear: DEFAULT_GEAR }
      }
      initGear(p.gear)
      await ensureSchedule(p)
      await migrateTemplates(p)
      setProfile(p)
    } else {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (profile === undefined) return null
  if (profile === null) return <Onboarding onDone={load} />

  return (
    <div className="app-shell">
      {tab === 'today' && <TodayScreen profile={profile} />}
      {tab === 'calendar' && <CalendarScreen />}
      {tab === 'progress' && <ProgressScreen profile={profile} />}
      {tab === 'settings' && <SettingsScreen profile={profile} onProfileChange={load} />}
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
