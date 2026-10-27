# PaniBook

Contractor app for matching walk-in migrant workers to enterprise needs.
Malayalam UI by default, English toggle. See `buildbrief.md` for the full brief and
`PRODUCT.md` for the product record.

## Run locally

Needs Node 20.9+ and Docker (for Postgres).

```sh
npm install
cp .env.example .env       # defaults work for local dev
npm run db:up              # starts Postgres on localhost:5433
npm run setup              # applies migrations + seeds skills/categories
npm run dev                # http://localhost:3000
```

Open the app, tap **Create account**, and sign up with any phone number and a 4–6 digit PIN.
Then tap **Load sample data** on the home screen (or in Settings).

## What's in it

| Area | Where |
| --- | --- |
| Home: area board, New Worker / New Need, figures, latest needs | `src/app/(app)/page.tsx` |
| Workers: list, add/edit (photo, voice, skill video, consent), detail + matching needs, profile link | `src/app/(app)/workers/` |
| Needs: list, add/edit (voice, pick or add shop inline), detail + matching workers | `src/app/(app)/needs/` |
| Shops: list, detail, **Find businesses** by location, map | `src/app/(app)/enterprises/`, `src/app/(app)/map/` |
| Placements: reserve worker → shop pays upfront → worker sent, trial (guarantee) → earned; refund or send a replacement if the worker fails; WhatsApp payment request; 1-tap rating | `src/app/(app)/placements/` |
| Public worker profile `/w/<token>` (contractor as contact, no worker phone, `noindex`) | `src/app/w/[token]/` |
| Owner-only AI usage page `/admin` (protected by `ADMIN_PIN`) | `src/app/admin/` |
| Settings: base location, trial days, sample data, CSV export, delete account | `src/app/(app)/settings/` |

## Sample (demo) data

**Load sample data** adds, for the logged-in contractor only:

- **Real shops near their base** from OpenStreetMap: bundled exports in `data/osm/*.geojson` first;
  only when no bundled file covers the area, one cached, rate-limited live Overpass query.
  Liquor outlets, schools, banks, places of worship etc. are filtered out (`src/config/osm-import.ts`).
  These shops are kept as normal records.
- **Sample needs, 40 sample workers, past placements with ratings**, one commission due and one
  trial ending soon (`src/config/demo.ts`). These are `is_demo` in the database.

There are no DEMO badges in the UI. When samples are loaded, an (i) button in the header explains
what is sample. Call/WhatsApp about a sample worker or need never reaches the real shop: it goes to
`DEMO_WHATSAPP_NUMBER` if set, otherwise the buttons are off. Settings → **Remove sample data** clears
only the samples.

CLI: `npm run demo:load -- <contractor phone>` / `npm run demo:clear -- <phone>`.
To add another town offline, export from overpass-turbo as GeoJSON into `data/osm/`.

## Voice intake and AI limits

Voice notes (≤60 s) are transcribed with OpenAI and turned into a filled form, which the contractor
checks before saving. Manual entry always works.

- Off by default: needs `AI_ENABLED=true` **and** `OPENAI_API_KEY`.
- Models (env, defaults): `gpt-4o-mini-transcribe` and `gpt-5-nano`. Prices in `src/config/ai-pricing.ts`.
- Hard limits, checked before **every** call, under a DB lock (`src/lib/ai/usage.ts`):
  `AI_MAX_INTAKES_PER_DAY=5` (whole app), `AI_MAX_INTAKES_PER_HOUR_PER_CONTRACTOR=3`,
  `AI_MONTHLY_CAP_USD=2`, `AI_DAILY_CAP_PER_CONTRACTOR_USD=0.1`. One intake costs about $0.004.
- Every call (allowed or blocked) is recorded in `ai_usage`; `/admin` shows spend and remaining budget.

Free map services (Overpass, Nominatim) are cached for 14 days and capped per day
(`src/config/limits.ts`, env-overridable).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server (binds `0.0.0.0:$PORT`) |
| `npm test` | Unit + DB integration tests (Vitest; needs the database) |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |
| `npm run db:generate` | New SQL migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations in `drizzle/` |
| `npm run db:seed` | Seed/refresh skills and categories (safe to re-run) |
| `npm run setup` | `db:migrate` + `db:seed` |
| `npm run demo:load -- <phone>` / `demo:clear` | Sample data for one contractor |

## Environment variables

All listed with comments in `.env.example`. Minimum to run: `DATABASE_URL`, `APP_BASE_URL`.

## Deploy on Replit

See **[REPLIT.md](REPLIT.md)** for the full step-by-step guide (database, Object Storage, secrets,
publishing, turning on voice, updating, troubleshooting).

## Notes

- **Tenant isolation:** every tenant table has `contractor_id`; every function in `src/lib/data/` takes it
  and filters on it. `tenant-isolation.test.ts` and `placements.test.ts` check one contractor can't read,
  list, match, change or delete another's data.
- **Privacy:** public pages never show the worker's phone; photo and skill video only with consent and a
  live link; media is served through `/api/media/…`, which checks ownership or consent.
- **Sessions:** random token in an httpOnly cookie, sha256 in the DB. **PINs:** scrypt; 5 wrong tries
  lock for 15 minutes.
- **Phones:** built for Android Chrome **and iPhone Safari** (iOS 15+). Voice notes record as WebM on Android and MP4/AAC on iPhone; photos are resized to JPEG on the phone (HEIC works); skill videos accept iPhone `.mov` up to 25 MB; Settings and Home show "Add to Home Screen" steps on iPhone and an Install button on Android.
- **Offline:** installable PWA; a service worker caches static assets and shows an offline page; New
  Worker / New Need forms keep an unsent draft on the phone.
- **Design:** "destination board" system (bus red, board yellow, board black) in `src/app/globals.css`;
  see `DESIGN.md`.
