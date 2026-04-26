# Abundance App — Development State

**App Directory:** `/home/azur/.gemini/antigravity/scratch/manifestation-app/`
**Live URL:** `https://azurelight777-coder.github.io/abundance-app/`
**GitHub Repo:** `azurelight777-coder/abundance-app` (branch: `main`)
**Push Worker:** `https://sylvia.azurelight777.workers.dev` (separate project at `~/abundance-worker/`)

## Concept
Magickal manifestation banking PWA. User receives a daily energetic "deposit" (abundance flow) which doubles every 28-day moon cycle. The user "spends" it on intentions/manifestations to stretch the imagination and anchor wealth in Malkuth (the material plane). Practice tool — designed to be set down once the practice is internalized.

## Live Architecture
- **Frontend:** Vite + React + Tailwind + injectManifest service worker (PWA)
- **Push backend:** Cloudflare Worker named `sylvia` with KV storage for subscriptions
- **Cron:** hourly `30 * * * *` UTC, gated by Jupiter-hour table (UTC mapping for Sri Lanka SLST)
- **Push library:** `@block65/webcrypto-web-push` for VAPID-signed payloads
- **VAPID keys:** stored at `~/abundance-worker/.vapid-keys.json` (gitignored)
  - Public key baked into frontend (App.jsx)
  - Private key set as Cloudflare secret on `sylvia` worker

## Sylvia (the prosperity servitor)
- Notification "from" name = **Sylvia**
- First-person voice ("I bring you...")
- Icon = `manta.png` (Sylvia's manta ray form, already in `public/`)
- Notification body format:
  > **Sylvia**
  > I bring you LKR X. Cycle N · Day M.
  >
  > [today's affirmation, rotating by daysActive]

## Jupiter-hour Schedule (Sri Lanka, UTC+5:30)
| Day | Local time | UTC hour |
|-----|-----------|----------|
| Sun | 11:00 AM  | 05:30 UTC |
| Mon | 08:00 AM  | 02:30 UTC |
| Tue | 12:00 PM  | 06:30 UTC |
| Wed | 09:00 AM  | 03:30 UTC |
| **Thu** | **06:00 AM** | **00:30 UTC (Jupiter on Jupiter's day — peak)** |
| Fri | 10:00 AM  | 04:30 UTC |
| Sat | 07:00 AM  | 01:30 UTC |

Encoded in `~/abundance-worker/src/index.ts` as `JUPITER_UTC_HOUR_BY_WEEKDAY`.

## What Was Shipped This Session
1. ✅ Fixed white-screen render bug (setExpandedDates was being called during render)
2. ✅ Reverted decorative dragon to `ancient_dragon.png`
3. ✅ Magickal button text — "Into the Flow of Abundance" / "Offer to the Hoard"
4. ✅ Doubling-cycle math (base 1000 USD/day, doubles every 28 days)
5. ✅ Renamed Savings Vault → **Dragon Hoard**
6. ✅ Per-transaction × delete and ✨ manifested toggle
7. ✅ Settings: Export/Import JSON backup
8. ✅ New cat icon (try1-medium, larger crop)
9. ✅ Cloudflare Worker `sylvia` with cron + KV + VAPID
10. ✅ Service worker push handler + Settings "Daily Pulse" toggle
11. ✅ Curated 28-affirmation rotation (Gatoga Shekinah + Increase + KJV Psalms)
12. ✅ Notification voiced as Sylvia, first-person, manta icon
13. ✅ "Fire test notification" diagnostic button in Settings

## Known Limitation: Firefox Android Push
Firefox Android installs PWAs as **web shortcuts**, not real apps. Push notifications are unreliable:
- Local notification (test button) **works** — SW + permission + display path is fine
- Cloudflare → Mozilla **works** — worker reports `sent: 1`
- Mozilla → phone **fails** — Firefox needs to be running in background, often killed by Android battery management

**Resolution path: install via Chrome instead.** Chrome does proper standalone PWA installs with reliable push. Same URL, same code, just install from Chrome.

## Pending / Next Session Ideas
- Test push delivery via Chrome installation
- Optional: in-app daily greeting modal as fallback for closed-app days
- Optional: ledger row showing day's net (credited - spent - hoard) instead of just credited
- Add Ariel Gatoga's audiobook concepts (longer prosperity meditations) — third transcript in `~/gatoga-transcripts/`
- Sylvia's voice could deepen — currently first-person abundance daemon, could grow

## Current Subscription
Azure's Firefox Android subscription is in KV (`SUBSCRIPTIONS` namespace, id `6bdc22b0e7dc4349a8281339168c46e2`). Endpoint: `https://updates.push.services.mozilla.com/wpush/v2/...`. Created 2026-04-26.

## Quick Test Commands
```bash
# Health check
curl -s https://sylvia.azurelight777.workers.dev/health

# Fire push to all subscriptions
curl -s -X POST https://sylvia.azurelight777.workers.dev/test

# Tail worker logs
cd ~/abundance-worker && wrangler tail --format pretty

# List subscriptions
cd ~/abundance-worker && wrangler kv key list --binding SUBSCRIPTIONS --remote
```
