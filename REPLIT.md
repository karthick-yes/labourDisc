# Hosting PaniBook on Replit

Step by step, from GitHub to a live `https://<name>.replit.app` link you can open on Android and iPhone.
Develop locally, push to GitHub, pull and publish on Replit.

> Replit renames menus fairly often. If a button below has a slightly different name, look for the same
> tool in the left sidebar ("Tools") or the search box at the top of the workspace.

---

## 0. Before you start

- [ ] The code is **committed and pushed** to `https://github.com/karthick-yes/labourDisc`
      (nothing in this repo is committed yet).
- [ ] A Replit plan that can publish apps (Core or above).
- [ ] Optional, for voice entry: a **separate OpenAI project and API key** used only by this app.

---

## 1. Import the repo

1. Replit home → **Create App** → **Import from GitHub**.
2. Connect GitHub if asked, pick `karthick-yes/labourDisc`, import.
3. Replit reads `.replit` and sets up **Node 22** and **PostgreSQL 16**. Don't let Agent "fix" or rewrite the project.

## 2. Add the database

1. Open the **Database** tool → create a **PostgreSQL** database.
2. Replit adds a `DATABASE_URL` secret automatically. This is your **development** database.
   The production database is created for you on first publish (step 6).

## 3. Add Object Storage (photos, voice notes, videos)

1. Open the **Object Storage** tool → **Create bucket**.
2. Replit writes the bucket into `.replit` (`[objectStorage] defaultBucketID = "..."`). Keep that change.
   The app finds the bucket on its own; no key is needed.

Without this (or with `STORAGE_DRIVER=local`), uploaded photos are written to the deployment's disk and
**disappear on every redeploy**.

## 4. Secrets

Open the **Secrets** tool and add:

| Secret | Value | Needed |
| --- | --- | --- |
| `STORAGE_DRIVER` | `replit` | **Yes** |
| `APP_BASE_URL` | Your published URL, e.g. `https://panibook.replit.app` (fill in after step 6, then republish) | **Yes** (used in WhatsApp profile links) |
| `SIGNUP_CODE` | Any word you tell contractors, e.g. `kerala2026` | Strongly recommended: stops strangers creating accounts |
| `ADMIN_PIN` | A long PIN only you know | Yes, for `/admin` (AI spend page) |
| `DEMO_WHATSAPP_NUMBER` | Your own number with country code, e.g. `919847000000` | For demos: sample-record WhatsApp/Call buttons go to you instead of being switched off |
| `OPENAI_API_KEY` | The dedicated key | Only for voice entry |
| `AI_ENABLED` | `true` | Only for voice entry (leave unset to keep voice off) |

Optional limits. The defaults are already tight; set these only to change them:

| Secret | Default |
| --- | --- |
| `AI_MAX_INTAKES_PER_DAY` | `5` (whole app) |
| `AI_MAX_INTAKES_PER_HOUR_PER_CONTRACTOR` | `3` |
| `AI_MONTHLY_CAP_USD` | `2` |
| `AI_DAILY_CAP_PER_CONTRACTOR_USD` | `0.1` |
| `OPENAI_TRANSCRIBE_MODEL` / `OPENAI_EXTRACT_MODEL` | `gpt-4o-mini-transcribe` / `gpt-5-nano` |
| `OVERPASS_PER_DAY` / `NOMINATIM_PER_DAY` | `40` / `100` (free map lookups) |

Don't set `DATABASE_URL` yourself; Replit manages it. When publishing, check that these secrets are also
listed for the published app (Replit shows them on the publish screen).

## 5. First run in the workspace

In the **Shell**:

```sh
npm install
npm run setup        # creates the tables in the dev database + loads skills/categories
```

Press **Run**. The app opens in the preview. Create an account (use the `SIGNUP_CODE`), then tap
**Load sample data** to check that everything works.

## 6. Publish

1. Open **Publishing** (or **Deploy**).
2. Pick a type:
   - **Reserved VM**: always on and instant to open. Best for showing to contractors.
   - **Autoscale**: cheaper, but it sleeps when nobody uses it and the first open takes a few seconds.
     If you use it, set **max instances = 1** and open the link a minute before a demo.
3. The build and run commands come from `.replit`. You don't need to type them:
   - build: `npm ci && npm run build`
   - run: `node scripts/deploy-db.mjs && npm run db:seed && PORT=3000 npm run start`
4. **Publish**. On the first publish Replit creates a **production database** and points the app's
   `DATABASE_URL` at it. On start, `scripts/deploy-db.mjs` prepares that database. It handles both a fresh
   database and one whose tables Replit already copied from development, and connects over SSL.
5. Copy your `https://….replit.app` URL into the `APP_BASE_URL` secret and **publish again**, so WhatsApp
   profile links point to the live site.

## 7. After the first publish

- [ ] Open the URL on your phone, sign up as the first contractor (with `SIGNUP_CODE`).
- [ ] Settings → set your area → **Load sample data**.
- [ ] Open `https://….replit.app/admin`, enter `ADMIN_PIN`: AI shows OFF or ON, spend $0.
- [ ] **Android:** Settings shows **Install app**. **iPhone (Safari):** Home and Settings show
      Share → Add to Home Screen.

### Phone check (needs the HTTPS link, not the preview)

| Check | Android Chrome | iPhone Safari |
| --- | --- | --- |
| New Worker → **Take photo** opens the camera, photo saves | ☐ | ☐ |
| **Add skill video** records ≤20 s and saves | ☐ | ☐ |
| **Record voice** asks for the mic (only when AI is on) | ☐ | ☐ |
| **Use my current location** works (Settings) | ☐ | ☐ |
| WhatsApp button opens WhatsApp with the Malayalam card | ☐ | ☐ |
| Add to Home Screen → opens full screen | ☐ | ☐ |

Notes: an installed iPhone app keeps its own login (log in once more after installing). iPhone videos are
`.mov` files of 15–25 MB; the limit is 25 MB.

## 8. Turning on voice entry (OpenAI)

1. In the OpenAI dashboard, create a **new project** just for PaniBook, set a **monthly budget limit** on
   that project too, and create an API key in it.
2. Add secrets `OPENAI_API_KEY` and `AI_ENABLED=true`, then republish.
3. New Worker → **Record voice** → speak → the form fills → check and save.
4. `/admin` shows each call and the remaining budget. One voice entry costs about **$0.004**. The app
   blocks calls past the caps, and failed calls aren't counted.

To switch voice off instantly: set `AI_ENABLED=false` and republish. Typing always works.

## 9. Updating the live app

1. Change code locally, run `npm test`, then commit and push to GitHub.
2. In Replit: **Git** tool → **Pull**.
3. If the change includes a database migration (new file in `drizzle/`), run `npm run db:migrate` in the
   Shell (updates the dev database).
4. **Publish** again. The production database is updated on start.

## 10. Troubleshooting

| Problem | Fix |
| --- | --- |
| Publish fails during `deploy-db.mjs` | Open the deployment logs; it prints which case it handled. Paste the error to Claude. |
| `SSL`/`self-signed certificate` errors connecting to the DB | Add secret `DATABASE_SSL=true`, or check `DATABASE_URL` has `sslmode=require`. |
| Photos vanish after a redeploy | `STORAGE_DRIVER` isn't `replit`, or no Object Storage bucket (step 3). |
| Voice block says "isn't set up" | `OPENAI_API_KEY` missing or `AI_ENABLED` not `true` (republish after changing). |
| Voice block says "limit reached" | Daily/monthly cap hit (by design). Raise the secret if you really want more. |
| WhatsApp profile link points to `localhost` | Set `APP_BASE_URL` to the `.replit.app` URL and republish. |
| Camera / mic / GPS do nothing | Use the published HTTPS link; check the phone allowed the permission. |
| Live map lookups say "limit reached" | Daily free-service limit; the bundled Perumbavoor shops still work. |
| Anyone can sign up | Set `SIGNUP_CODE`. |

## What I could not test

This was built and tested locally (Docker Postgres, local file storage, Chromium with iPhone emulation).
These run only on Replit and haven't been run there yet:

- Replit Object Storage (`STORAGE_DRIVER=replit`)
- Replit's production database and its publish-time schema copy (the startup script handles both cases
  in local tests)
- Real OpenAI calls (needs your key)
- Real iPhone Safari (only simulated)

Do the phone check in step 7 right after the first publish.
