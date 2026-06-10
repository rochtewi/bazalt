/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

// Precache the whole app so it works with no connection at all.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Daily reminder pushed by the GitHub Actions cron job.
self.addEventListener('push', (event) => {
  let title = 'bazalt'
  let body = 'Today’s work is set.'
  try {
    const data = event.data?.json()
    if (data?.title) title = data.title
    if (data?.body) body = data.body
  } catch {
    // No/invalid payload — use the defaults.
  }
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients.find((c) => 'focus' in c)
      if (open) return (open as WindowClient).focus()
      return self.clients.openWindow('./')
    }),
  )
})
