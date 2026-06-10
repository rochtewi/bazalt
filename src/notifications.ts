import { VAPID_PUBLIC_KEY } from './config'
import { hasSauna } from './data/library'
import { getRange } from './engine/scheduler'
import { addDays, today } from './db'
import type { Profile } from './types'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** iOS only exposes push to PWAs launched from the Home Screen. */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone)
  )
}

/**
 * Ask permission and subscribe. Returns the subscription JSON the user pastes
 * into the GitHub PUSH_SUBSCRIPTION secret so the daily cron can reach this phone.
 */
export async function subscribeToPush(): Promise<string> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    }))
  return JSON.stringify(sub.toJSON())
}

export async function currentSubscription(): Promise<string | null> {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return sub ? JSON.stringify(sub.toJSON()) : null
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
}

/**
 * Offline fallback for reminders: export the next 4 weeks as a calendar file.
 * Imported into Apple Calendar, each workout carries a native alert — no
 * server involved at all.
 */
export async function buildICS(profile: Profile): Promise<string> {
  const days = await getRange(today(), addDays(today(), 27))
  const hour = String(profile.notifyHour).padStart(2, '0')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//bazalt//Training//EN',
    'CALSCALE:GREGORIAN',
  ]
  for (const d of days) {
    if (d.templateKey === 'rest' || d.status !== 'pending') continue
    const dt = d.date.replace(/-/g, '')
    const summary = d.sauna && hasSauna() ? `${d.title} + Sauna` : d.title
    lines.push(
      'BEGIN:VEVENT',
      `UID:forge-${d.date}@forge.local`,
      `DTSTAMP:${dt}T000000`,
      `DTSTART:${dt}T${hour}0000`,
      `DTEND:${dt}T${hour}3000`,
      `SUMMARY:${icsEscape(`bazalt: ${summary}`)}`,
      `DESCRIPTION:${icsEscape(d.focus)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Workout time',
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadICS(content: string): void {
  const blob = new Blob([content], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'bazalt-training.ics'
  a.click()
  URL.revokeObjectURL(url)
}
