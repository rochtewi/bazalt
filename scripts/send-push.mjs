// Runs inside GitHub Actions on a daily cron. Sends a web push to the phone
// subscription stored in the PUSH_SUBSCRIPTION secret, signed with the VAPID
// private key in VAPID_PRIVATE_KEY. No data ever flows the other way.
import webpush from 'web-push'

const VAPID_PUBLIC_KEY =
  'BI4_FAzcCvIm7rqS1rJ90kiXN5MDVVvl2t3X9x8Ti47vZA4Bx6XBVN7FrEpFbFogU-SjUwNiew5QaIZR_lP5PZs'

const privateKey = process.env.VAPID_PRIVATE_KEY
const subRaw = process.env.PUSH_SUBSCRIPTION

if (!privateKey) {
  console.error('Missing VAPID_PRIVATE_KEY secret.')
  process.exit(1)
}
if (!subRaw) {
  console.log('No PUSH_SUBSCRIPTION secret set yet — nothing to do. ' +
    'Enable notifications in the app, copy the subscription, and add it as a repo secret.')
  process.exit(0)
}

let subscription
try {
  subscription = JSON.parse(subRaw)
} catch {
  console.error('PUSH_SUBSCRIPTION secret is not valid JSON.')
  process.exit(1)
}

webpush.setVapidDetails('mailto:forge@localhost.invalid', VAPID_PUBLIC_KEY, privateKey)

const messages = [
  'Time to train. Open Forge for today’s plan. 🔥',
  'Your workout is loaded and waiting. 💪',
  'The bar isn’t going to lift itself. Today’s plan is ready.',
  'Show up today — future you says thanks.',
]
const body = messages[new Date().getDate() % messages.length]

try {
  await webpush.sendNotification(subscription, JSON.stringify({ title: 'Forge — Workout of the Day', body }))
  console.log('Push sent.')
} catch (err) {
  if (err.statusCode === 404 || err.statusCode === 410) {
    console.error('Subscription expired — re-enable notifications in the app and update the secret.')
  }
  throw err
}
