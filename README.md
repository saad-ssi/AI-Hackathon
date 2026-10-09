# AI Hackathon 2026 — Portal

Public site for the SSI AI Hackathon: event info, use cases, rubric, the Vercel guide, registration and submission.
Registrations and submissions are stored in a Neon Postgres database, which lives separately from the website itself.

| Page | Who | Purpose |
| --- | --- | --- |
| `/` | Public | Objective, key dates, at a glance, how it works, prizes |
| `/use-cases` | Public | Must-haves, 8 sample use cases, bring your own idea |
| `/rules` | Public | Rubric, judging panel, rules, tools |
| `/guide` | Public | Vercel quickstart (from `content/quickstart.md`) |
| `/register` | Public | Registration form (company emails only) |
| `/submit` | Public | Submission form; resubmits allowed until the deadline, every version kept |
| `/admin` | Password | All registrations and submissions, CSV downloads |

## Set it up (about 20 minutes)

### 1. Put the code on GitHub
Follow Steps 1 and 6 of `content/quickstart.md` (install Node.js and Git, create a GitHub repo, push this folder).
Create the repo as **Private** if you prefer; Vercel can deploy private repos.

> Tip: keep this project outside OneDrive when you run `npm install`, or OneDrive will try to sync thousands of files in `node_modules`.

### 2. Import it into Vercel
Vercel → **Add New… → Project** → import the repo → **Deploy**. The first deploy works without a database; forms will show an error until step 3 is done.

### 3. Add the database (free)
In the Vercel project: **Storage → Create Database → Neon (Serverless Postgres)** → pick the free plan and a region near your users.
When connecting it to the project: keep **All Environments**, leave both **database branch** boxes unticked, and type `DATABASE` as the **Custom Prefix** so the setting is named `DATABASE_URL`.
Tables are created on first use. Then **Deployments → ⋯ → Redeploy**.

### 4. Set environment variables
Vercel project → **Settings → Environment Variables** (see `.env.example`):

| Name | Value |
| --- | --- |
| `ADMIN_PASSWORD` | A long password for `/admin` |
| `ALLOWED_EMAIL_DOMAINS` | `ssidecisions.com` (comma-separate to allow more) |
| `EVENT_TIMEZONE` | e.g. `America/Los_Angeles` or `Asia/Karachi` |
| `REGISTRATION_CLOSES` | e.g. `2026-11-13T18:00:00-08:00`, or leave empty for TBD |
| `KICKOFF_AT` | Same format, or empty |
| `SUBMISSIONS_CLOSE` | Same format, or empty |
| `WINNERS_ANNOUNCED` | Same format, or empty |

Empty dates show as **TBD** and keep the forms open. Once a close date passes, that form closes automatically.
Then **Deployments → ⋯ → Redeploy** so the new values take effect.

### 5. Test before announcing
1. Register with your own `@ssidecisions.com` email, then submit a test entry.
2. Check both appear in `/admin`, and that the CSV downloads open in Excel.
3. Delete the test rows afterwards (Neon console → **Tables**).

## Where the data lives, and keeping copies
- **Neon is separate from the website.** If the site breaks, the data is untouched. Open it from Vercel → **Storage** → your database → **Open in Neon**, then **Tables** to browse or **SQL Editor** to query.
- **Keep your own copies.** During busy periods (registration close, submission weekend), download the three CSVs from `/admin` into OneDrive, for example once a day.
- **Someone overwrote a submission:** every version is kept. Download "all submission versions" from `/admin`.

## Editing content
All wording — objective, use cases, rubric, rules, prizes — is in `lib/config.ts`. The guide is `content/quickstart.md`. Commit and push; Vercel redeploys automatically.

## Run locally (optional)
```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL etc.
npm run dev                  # http://localhost:3000
```
