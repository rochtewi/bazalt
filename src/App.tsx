import { useCallback, useEffect, useState } from 'react'
import { db } from './db'
import { ensureSchedule } from './engine/scheduler'
import type { Profile } from './types'
import Onboarding from './screens/Onboarding'
import TodayScreen from './screens/Today'
import CalendarScreen from './screens/CalendarScreen'
import ProgressScreen from './screens/Progress'
import SettingsScreen from './screens/Settings'

type Tab = 'today' | 'calendar' | 'progress' | 'settings'

const TABS: { id: Tab; label: string; ico: string }[] = [
  { id: 'today', label: 'Today', ico: '🔥' },
  { id: 'calendar', label: 'Calendar', ico: '📅' },
  { id: 'progress', label: 'Progress', ico: '📈' },
  { id: 'settings', label: 'Profile', ico: '👤' },
]

export default function App() {
  // undefined = loading, null = needs onboarding
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)
  const [tab, setTab] = useState<Tab>('today')

  const load = useCallback(async () => {
    const p = await db.profile.get('me')
    if (p) {
      await ensureSchedule(p)
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
            <span className="ico">{t.ico}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
