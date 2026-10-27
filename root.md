# Build Brief: Contractor Matching App (working name: PaniBook)

> Read this whole file before writing any code. Build in the milestones listed at the end, one at a time, and stop after each milestone so I can review. Ask me before making any big architectural decision not covered here.

## 1. What we're building and why

Labour contractors in Kerala (Perumbavoor, Thodupuzha) connect migrant workers to local businesses ("enterprises"). Today a contractor runs everything from two paper books:

- **Needs book**: which enterprises need which workers (e.g., "Shop X needs 2 welders, ₹1,100/day").
- **Workers book**: workers looking for jobs and what they say they can do.

Workers walk in, the contractor asks what they know, searches his books by hand, calls the enterprise, sends a photo of the worker, and explains what the worker can do. This takes about 5 minutes per worker and depends entirely on his memory.

**The app digitizes the two books and matches them automatically.** A walk-in worker should go from intake to a WhatsApp profile card sent to a matching enterprise in under 60 seconds.

### Business context (shapes design decisions)

- The customer is the **contractor**, not the worker or the enterprise. He pays for this. Everything should make him faster and look more professional.
- The immediate goal is a **demo** good enough to sell a paid pilot to 1–2 contractors. Polish the core flow; skip everything else.
- **The contractor's data is his.** Strict per-contractor data isolation. We never share or use one contractor's workers/enterprises with anyone else.
- **Never expose the worker's phone number to enterprises.** Share cards and profile pages show the contractor as the contact. Otherwise enterprises bypass the contractor and he loses his commission.

### How the contractor's money works today (model this in the app)

- Commission = roughly one day's wage of the worker, paid by the enterprise.
- The enterprise holds that commission until the worker proves himself during a probation period.
- If the worker doesn't perform or leaves, the commission may not be paid.

## 2. Users and constraints

- Contractor: Malayali, uses a phone all day, WhatsApp-native, low patience for complexity. Not a "software user".
- Workers: from Assam, West Bengal and elsewhere. Speak Hindi, Bengali, Assamese. Do NOT use the app in v1; the contractor operates it on their behalf.
- Enterprises: local businesses (bakeries, restaurants, supermarkets, hardware stores, workshops, plywood units). Do NOT log in in v1. They receive WhatsApp messages and open a public profile link.

**Design rules**

- Mobile-first, installable as a PWA (add to home screen). Must work well on a mid-range Android phone over patchy 4G.
- **Malayalam UI by default**, English toggle. All UI strings in a translation file, never hard-coded. A native speaker will review Malayalam copy later, so keep it simple.
- Big tap targets, minimal typing. Prefer voice, photo, and pick-from-list over text fields.
- Every primary action reachable in 1–2 taps from home.

## 3. Core flows (v1)

### Flow A: Worker walk-in intake

1. Contractor taps **New Worker**.
2. Takes a photo of the worker (camera capture).
3. Records a voice note (up to ~60s). Either the worker speaks (Hindi/Bengali/Assamese) or the contractor summarizes in Malayalam.
4. Backend: speech-to-text, then an LLM call that extracts a structured profile:
   - name, skills (mapped to canonical skills, see §6), years of experience per skill, expected daily wage, home state, availability, short free-text notes.
5. Contractor sees the pre-filled profile, edits anything wrong, saves. Manual entry must always be possible if voice fails.
6. Optional: attach a short skill video (≤20s), e.g., the worker welding.
7. Optional consent checkbox: "Worker agreed to photo/video being shared with employers". Sharing media is blocked unless checked.
8. **Immediately after saving, show matching open Needs** (Flow C).

### Flow B: Add an enterprise need

1. Contractor taps **New Need** (usually while on a call with an enterprise).
2. Picks an existing enterprise or adds a new one (name, phone, location on map or typed area, category).
3. Selects skill, number of workers, daily wage offered, start date, notes. Voice input option here too.
4. On save, **show matching available Workers**.

### Flow C: Matching (both directions)

- From a worker: ranked list of open Needs.
- From a need: ranked list of available Workers.
- Each result shows: match score as a simple label (Strong / Good / Possible), skill match, distance, wage comparison, worker rating if any.
- Each result has: **Call** button (tel: link) and **Send on WhatsApp** button (Flow D).
- See §7 for scoring.

### Flow D: Share worker card on WhatsApp

- Opens WhatsApp via `https://wa.me/<enterprise_phone>?text=<urlencoded message>`. No WhatsApp Business API in v1.
- Message is in Malayalam, short, with a link to a public profile page. Example template (to be reviewed by a native speaker):

```
👷 തൊഴിലാളി: {worker_name}
കഴിവ്: {skill} ({years} വർഷം)
പ്രതീക്ഷിക്കുന്ന കൂലി: ₹{wage}/ദിവസം
പ്രൊഫൈൽ: {profile_link}
ബന്ധപ്പെടുക: {contractor_name}, {contractor_phone}
```

- **Public profile page** `/w/{unguessable_token}`: photo, skills, experience, rating from past placements (if any), skill video (if consented), contractor's name and phone. **No worker phone number. No ID documents.** Token can be revoked.

### Flow E: Placements and money tracker

- When a match is agreed, contractor taps **Mark Placed**: links worker + need, start date, wage, commission amount (default = 1 day's wage, editable), probation days (default configurable in settings, e.g. 7).
- Placement statuses: `trial` → `confirmed` → `ended`, or `trial` → `failed` (worker left / didn't perform).
- Commission statuses: `held` → `due` → `received`, or `lost`.
- When probation ends, the commission auto-moves from `held` to `due` and appears on the home screen.
- **Reminder button**: opens WhatsApp to the enterprise with a polite prefilled Malayalam reminder about the commission.
- Placing a worker sets his availability to "placed"; ending a placement sets it back to "available".

### Flow F: Rating after placement

- When a placement is confirmed or ends, prompt the contractor for a 1-tap rating (1–5) plus an optional short note on what the enterprise said.
- Ratings show on the worker's profile and public page as "Rated X by N employers". This is the beginning of the proof-of-skill layer, so make it visible.

### Home screen

- Big buttons: **New Worker**, **New Need**.
- Cards: open needs count, available workers count, commissions due (with total ₹), placements in trial ending soon.
- Search bar (searches workers, enterprises, needs).

### Map view

- Map centered on the contractor's location (location L) showing enterprises as pins, colored by whether they have open needs.
- Use Leaflet with OpenStreetMap tiles (attribution required; fine for low-volume demo use).

## 4. Demo mode and seed data

We don't have the contractor's real books yet, so the demo runs on real local businesses plus clearly-labeled sample data.

- `/data/overpass_perumbavoor.json`: raw OpenStreetMap Overpass export (I'll provide). Write a seed script that:
  1. Parses nodes/ways (use `lat`/`lon`, or `center` for ways).
  2. **Filters out**: entries with no `name`; liquor outlets (`shop=beverages` with names like Bevco, `shop=alcohol`); schools/colleges/canteens (`amenity=*` with cafeteria or college names); bookshops and other unlikely employers. Keep the filter rules in one config file.
  3. Maps OSM tags to our enterprise categories (§6).
  4. Imports as enterprises with `source = "osm"`, storing the OSM id for attribution.
- Generate **sample needs** for ~30% of imported enterprises using the category→roles map, realistic wages (₹700–1,500/day depending on skill), and mark every one `is_demo = true`.
- Generate ~40 **sample workers** with plausible names from Assam/West Bengal, skills, wages, a few with ratings, all `is_demo = true`. Use placeholder avatar images, not real photos.
- UI shows a small "DEMO" badge on any demo record. A settings switch clears all demo data.
- Phone numbers from OSM: store only if present, but **disable Call/WhatsApp buttons for demo enterprises** so nobody accidentally messages a real shop during a demo.

**Optional, later (behind a feature flag, off by default):** Google Places API (New) Nearby Search to show additional businesses live. Only store `place_id`; fetch details live (Google terms forbid building our own database from results). Keep the field mask minimal; `nationalPhoneNumber` triggers the pricier Enterprise SKU.

## 5. Tech stack (Replit-hosted)

Keep it boring and simple. One repo, one deployable app.

- **Framework**: Next.js (App Router) + TypeScript, full-stack (API routes for backend).
- **DB**: PostgreSQL (Replit's built-in Postgres) with Drizzle ORM. Migrations checked in.
- **Styling**: Tailwind CSS. Mobile-first.
- **Map**: Leaflet + react-leaflet, OSM tiles.
- **Media storage**: Replit object storage (or S3-compatible), behind a small storage interface so it can be swapped.
- **Speech-to-text**: behind an interface `transcribe(audio, languageHint) -> text`. Must handle Malayalam, Hindi, Bengali (Assamese nice to have). Candidates: an Indian-language STT provider such as Sarvam AI, or OpenAI Whisper. Start with whichever is simplest to wire up; make it swappable via env var.
- **Profile extraction**: Anthropic API (`claude-haiku-5-5` for cost; `claude-sonnet-5-5` if quality is poor). Return strict JSON validated with Zod. Map free-text skills to canonical skill IDs.
- **Auth**: simple for v1: contractor logs in with phone number + PIN. Each contractor is a tenant; every query is scoped by `contractor_id`. No SMS OTP yet.
- **i18n**: next-intl (or similar), `ml` default, `en` secondary.
- **Env vars**: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `STT_PROVIDER`, `STT_API_KEY`, `GOOGLE_MAPS_API_KEY` (optional), `APP_BASE_URL`.

## 6. Data model

```
contractors     id, name, phone, pin_hash, base_lat, base_lng, area_name,
                default_probation_days, created_at

workers         id, contractor_id, name, photo_url, home_state, languages[],
                expected_wage, availability ('available'|'placed'|'inactive'),
                notes, voice_note_url, transcript, media_consent (bool),
                share_token, is_demo, created_at

worker_skills   worker_id, skill_id, years, self_reported (bool)

worker_media    id, worker_id, type ('photo'|'video'), url, created_at

enterprises     id, contractor_id, name, phone, category_id, lat, lng, area_name,
                source ('manual'|'osm'|'google'), source_ref, notes, is_demo, created_at

needs           id, contractor_id, enterprise_id, skill_id, count_needed, count_filled,
                wage_offered, start_date, status ('open'|'filled'|'cancelled'),
                notes, is_demo, created_at

placements      id, contractor_id, worker_id, need_id, start_date, wage,
                probation_days, status ('trial'|'confirmed'|'ended'|'failed'),
                commission_amount, commission_status ('held'|'due'|'received'|'lost'),
                commission_received_at, created_at

ratings         id, placement_id, worker_id, score (1-5), note, created_at

skills          id, canonical_name_en, name_ml, synonyms[]   -- seed table
categories      id, name_en, name_ml, osm_tags[]             -- seed table
category_roles  category_id, skill_id                        -- seed table
```

### Seed: skills (start with these; synonyms in English, Malayalam, Hindi, Bengali)

welder, fitter, electrician, plumber, mason, carpenter, painter, roofing/sheet worker, helper/general labour, loader, machine operator, cook, kitchen helper, juice maker, baker, cleaner, waiter/server, driver, plywood press operator, security.

### Seed: category → roles

| Category                                                                      | Typical roles                                            |
| ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| Bakery                                                                        | baker, helper, cleaner                                   |
| Restaurant / fast food / cafe                                                 | cook, kitchen helper, cleaner, waiter, juice maker       |
| Juice shop (OSM: `cuisine=juice` or name contains "juice")                    | juice maker, helper                                      |
| Supermarket                                                                   | loader, helper, cleaner                                  |
| Hardware store                                                                | loader, helper                                           |
| Workshop / craft                                                              | welder, fitter, helper                                   |
| Plywood / industrial (`landuse=industrial`, `industrial=*`, `man_made=works`) | machine operator, plywood press operator, loader, helper |
| Construction                                                                  | mason, helper, carpenter, painter, roofing worker        |

Note: in Kerala OSM data, `shop=beverages` is often a liquor outlet, not a juice shop.

## 7. Matching logic (v1: rules, not ML)

Score each worker–need pair 0–100. Start with these weights, keep them in a config file:

- **Skill match (50)**: exact canonical skill = 50; related skill (e.g., helper for any role) = 20; none = exclude.
- **Distance (20)**: distance from enterprise to contractor's base (workers don't have fixed locations). ≤5 km = 20, ≤15 km = 12, ≤30 km = 5, beyond = 0.
- **Wage fit (15)**: worker's expected wage ≤ offered = 15; within 10% above = 8; more = 0.
- **Rating (10)**: average rating × 2 (no rating = 5, neutral).
- **Experience (5)**: years in matched skill, capped.

Exclude workers who are `placed` or `inactive`. Exclude needs that are filled or cancelled. Labels: ≥75 Strong, ≥50 Good, otherwise Possible. Write unit tests for the scoring function.

## 8. Privacy and safety (non-negotiable)

- **No Aadhaar or other ID numbers stored in v1.** No ID document uploads. (Enterprises verify ID themselves today.)
- Worker photos/videos are only shared publicly if `media_consent = true`.
- Public profile pages: no worker phone, no home address, unguessable tokens, `noindex`, revocable.
- Strict tenant isolation: every DB query filtered by `contractor_id`; add a test that one contractor cannot read another's data.
- Contractor can export all his data (CSV) and delete his account.
- Follow India's DPDP Act basics: collect minimal data, state purpose, allow deletion.

## 9. Out of scope for v1 (do not build)

- Payments, escrow, payroll.
- Worker-facing or enterprise-facing logins/apps.
- OCR import of paper books (phase 2: a big selling point, but not now).
- "Verified/tested worker" premium tier and skill-test workflows.
- Lead generation (finding new enterprises), Google Places integration beyond the optional flag.
- WhatsApp Business API, SMS OTP, push notifications.
- Any cross-contractor marketplace or network.

## 10. Demo script (acceptance test)

The demo must do this smoothly on a phone:

1. Open app → home shows demo counts and a commission due.
2. Tap **New Worker** → photo → record a 20-second voice note in Hindi ("I've done welding for 5 years, I want ₹1,200 a day") → profile auto-fills correctly → save.
3. Matching needs appear instantly: a nearby workshop needing a welder ranked "Strong".
4. Tap **Send on WhatsApp** → WhatsApp opens with a Malayalam card and profile link (use a test number of mine, never a real shop).
5. Open the profile link → clean page with photo, skill, rating, contractor contact.
6. Mark Placed → placement shows in trial with commission "held".
7. Map view shows enterprises around Perumbavoor with open needs highlighted.

Target: steps 2–4 in under 60 seconds.

## 11. Milestones (stop after each for review)

1. **Skeleton**: Next.js app, DB schema + migrations, seed skills/categories, contractor login, home screen, Malayalam/English i18n, deployable on Replit.
2. **Books**: CRUD for workers, enterprises, needs. Manual entry only. Search.
3. **Seed data**: OSM import script with filters + demo needs/workers. Demo badge and clear-demo-data switch.
4. **Matching**: scoring function + tests, match lists from worker and from need, Call + WhatsApp buttons, public profile page.
5. **Voice intake**: audio recording, STT, LLM extraction to structured profile, edit-before-save.
6. **Placements + money**: placement lifecycle, commission statuses, probation auto-transition, reminder messages, ratings.
7. **Map + polish**: map view, PWA install, loading states, offline-tolerant forms, run through the demo script end to end.

## 12. Working conventions

- TypeScript strict mode. Zod for all API input validation.
- Keep business rules (scoring weights, filters, defaults) in config files, not scattered in code.
- Small, readable components. No premature abstraction.
- Write a short `README.md`: how to run locally, env vars, how to seed demo data, how to deploy on Replit.
- After each milestone, list what's done, what's stubbed, and any decisions you made that I should check.
