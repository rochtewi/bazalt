# 🔥 Forge — Home Workouts

An **offline-first workout app** for iPhone, built around your actual home gym: barbells, EZ bar,
adjustable bench with incline press rack, dip bars, pull-up bar, wind bike, hills outside — and a
dry sauna woven into the weekly schedule.

**Privacy by design:** there is no server, no account, and no analytics. Your profile, weight
history, and every logged set live in your phone's local database (IndexedDB) and never leave the
device. The only network traffic after install is a one-way daily reminder push *to* your phone.

## What it does

- **6-day program** (or 5 in Settings): Push A · Pull A · Legs A · Sprint Day · Push B · Pull B · Rest
- **Sauna scheduling** — 4 sauna sessions a week land on the heavier days, tracked like the workouts
- **Workout of the day** with per-set logging (weight × reps), exercise cues, and quick check-off
- **Push / Skip / Complete** — push moves today (and everything after it) one day later; skip keeps
  the rest of the week on plan
- **Skip or swap any single exercise** — swaps suggest same-movement-pattern alternatives that your
  equipment supports
- **Automatic progression** — hit the top of the rep range on every set and the next session's
  target weight goes up (double progression); bodyweight moves chase reps; sprints add rounds
- **Calendar** month view with done/planned/skipped markers
- **Progress** — streak, totals, body-weight chart, per-lift strength chart
- **Daily notification** sent by this repository's own GitHub Action (free, no third party)
- **Calendar export (.ics)** as a fully offline reminder fallback

## Install on your iPhone (one time, ~2 minutes)

1. On your iPhone, open **Safari** and go to your GitHub Pages URL
   (`https://<your-username>.github.io/forge-workouts/`).
2. Tap the **Share** button → **Add to Home Screen** → **Add**.
3. Launch **Forge from the home-screen icon** (this matters — notifications only work for
   home-screen apps on iOS).
4. Complete the welcome setup. Done — the app now works with zero internet connection.

## Turn on the daily notification (one time)

1. In the app: **Profile → Enable notifications** → allow.
2. Tap **Copy subscription**.
3. On GitHub: your repo → **Settings → Secrets and variables → Actions → New repository secret**.
   Name it `PUSH_SUBSCRIPTION`, paste, save.
4. Test it: repo → **Actions → Daily Workout Notification → Run workflow**. Your phone should buzz.

The send time is set in [.github/workflows/notify.yml](.github/workflows/notify.yml) (cron, UTC).
Default is 11:00 UTC ≈ 7:00 AM Eastern.

> Prefer zero-cloud reminders? **Profile → Export 4-week calendar (.ics)** adds native Apple
> Calendar alerts instead.

## How auto-building works

Every push to `main` triggers GitHub Actions to type-check, build, and deploy the app to GitHub
Pages. Your installed app picks the update up automatically the next time it's opened with a
connection — no reinstall, and your data is untouched (it lives in the phone's database, not in
the app files).

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
- The push subscription endpoint is also stored only as a secret, and pushes are one-way —
  nothing about your workouts or body data is ever transmitted.
