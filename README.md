# bazalt

An offline-first training app for iPhone. No server, no account, no analytics — your profile,
weight history, and every logged set live in your phone's local database and never leave the
device. Show up, log it, progress.

Named for basalt: stone forged in fire, cooled into something harder.

## What it does

- **6-day program** (or 5 in Settings): Push A · Pull A · Legs A · Sprint Day · Push B · Pull B · Rest
- **A core slot every training day**, with a ~30-movement ab library (mat, bar, and weighted)
- **Workout of the day** with per-set logging, exercise cues, and quick check-off
- **Push / Skip / Complete** — push moves today (and everything after it) one day later; skip keeps
  the rest of the week on plan
- **Skip or swap any single exercise** — swaps suggest same-movement-pattern alternatives that your
  equipment supports
- **Automatic progression** — hit the top of the rep range on every set and the next session's
  target weight rises (double progression); bodyweight moves chase reps; sprints add rounds
- **Equipment manager** — check off gear you own to unlock matching exercises; create custom ones
- **Custom workouts** — build your own (Murph, Ab Ripper, and other presets included) and place
  them on any calendar day, inserting or replacing that day's plan
- **Activity logging in real units** — runs in miles, hikes/swims/gardening in minutes
- **Timers** — tap any timed or interval exercise for a five-second lead-in and a live countdown;
  sprint blocks cycle work/rest rounds automatically
- **Calories burned & total weight moved** — MET-based estimates with week-over-week deltas; every
  Progress card opens weekly/monthly/lifetime breakdowns
- **Deload weeks** — every 6th week automatically lightens the load
- **Optional dry sauna scheduling** — modeled as equipment; without it, no sauna features appear
- **Daily notification** sent by this repository's own GitHub Action (free, no third party)
- **Calendar export (.ics)** as a fully offline reminder fallback

## Install on your iPhone (one time, ~2 minutes)

1. In **Safari**, open `https://rochtewi.github.io/bazalt/`
2. Tap **Share → Add to Home Screen → Add** (keep "Open as Web App" on)
3. Launch **bazalt from the home-screen icon** — notifications only work for home-screen apps on iOS
4. Complete the welcome setup. From then on it works with zero internet.

## Turn on the daily notification (one time per phone)

1. In the app: **Profile → Enable notifications** → allow
2. Tap **Copy subscription**
3. On GitHub: repo → **Settings → Secrets and variables → Actions → New repository secret** named
   `PUSH_SUBSCRIPTION`, paste, save
4. Test: repo → **Actions → Daily Workout Notification → Run workflow**

**Multiple phones**: the secret accepts a JSON list — wrap subscriptions in square brackets,
separated by commas. Each phone gets the daily push; an expired phone never blocks the others.

The send time is set in [.github/workflows/notify.yml](.github/workflows/notify.yml) (cron, UTC).
Default is 11:00 UTC ≈ 7:00 AM Eastern.

## How auto-building works

Every push to `main` triggers GitHub Actions to type-check, build, and deploy to GitHub Pages.
Installed apps pick the update up automatically on next open — no reinstall, data untouched.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build
node scripts/make-icons.mjs   # regenerate app icons from scripts/icon.svg
```

## Security notes

- All data is device-local; the app makes no outbound requests.
- Strict Content-Security-Policy (no third-party scripts, no inline JS, no frames).
- The web-push VAPID **private** key exists only as an encrypted GitHub Actions secret
  (`VAPID_PRIVATE_KEY`); the code ships only the public half.
- Push subscriptions are stored only as secrets, and pushes are one-way — nothing about your
  workouts or body data is ever transmitted.
