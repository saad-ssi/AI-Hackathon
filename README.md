# AI Hackathon 2026 — Portal

Public site for the SSI AI Hackathon: event info, use cases, rubric, the Vercel guide, registration and submission.
Every registration and submission is saved to a Postgres database **and** appended to a Google Sheet as a backup.

| Page | Who | Purpose |
| --- | --- | --- |
| `/` | Public | Objective, key dates, at a glance, how it works, prizes |
| `/use-cases` | Public | Must-haves, 8 sample use cases, bring your own idea |
| `/rules` | Public | Rubric, judging panel, rules, tools |
| `/guide` | Public | Vercel quickstart (from `content/quickstart.md`) |
| `/register` | Public | Registration form (company emails only) |
| `/submit` | Public | Submission form; resubmits allowed until the deadline, every version kept |
| `/admin` | Password | All registrations and submissions, CSV downloads, backup re-send |

## Set it up (about 30 minutes)

### 1. Put the code on GitHub
Follow Steps 1 and 6 of `content/quickstart.md` (install Node.js and Git, create a GitHub repo, push this folder).
Create the repo as **Private** if you prefer; Vercel can deploy private repos.

> Tip: keep this project outside OneDrive when you run `npm install`, or OneDrive will try to sync thousands of files in `node_modules`.

### 2. Import it into Vercel
Vercel → **Add New… → Project** → import the repo → **Deploy**. The first deploy works without a database; forms will show an error until step 3 is done.

### 3. Add the database (free)
In the Vercel project: **Storage → Create Database → Neon (Serverless Postgres)** → pick the free plan and a region near your users → **Connect** it to this project.
This adds `DATABASE_URL` to the project's environment variables automatically. Tables are created on first use.

### 4. Create the Google Sheet backup
1. Create a new Google Sheet, e.g. "AI Hackathon 2026 — Backup", in the Google account that should own the data.
2. **Extensions → Apps Script**. Delete the sample code and paste `google-apps-script/Code.gs`.
3. Change `SECRET` at the top to a long random string. Click **Save**.
4. **Deploy → New deployment** → gear icon → **Web app**. Set **Execute as: Me** and **Who has access: Anyone** → **Deploy**.
5. Approve the permissions prompt. If Google says "Google hasn't verified this app", click **Advanced → Go to … (unsafe)**: it's your own script.
6. Copy the **Web app URL** (ends in `/exec`). Opening it in a browser should show `"Hackathon backup receiver is running."`

The `Registrations` and `Submissions` tabs are created automatically on the first write. Rows are only ever appended (a full history, including updates and resubmits).

If you later edit the script, use **Deploy → Manage deployments → Edit → Version: New version**, or the URL keeps running the old code.

### 5. Set environment variables
Vercel project → **Settings → Environment Variables** (see `.env.example`):

| Name | Value |
| --- | --- |
| `ADMIN_PASSWORD` | A long password for `/admin` |
| `BACKUP_WEBHOOK_URL` | The Apps Script web app URL from step 4 |
| `BACKUP_SECRET` | The same secret you set in `Code.gs` |
| `ALLOWED_EMAIL_DOMAINS` | `ssidecisions.com` (comma-separate to allow more) |
| `EVENT_TIMEZONE` | e.g. `America/Los_Angeles` or `Asia/Karachi` |
| `REGISTRATION_CLOSES` | e.g. `2026-11-13T18:00:00-08:00`, or leave empty for TBD |
| `KICKOFF_AT` | Same format, or empty |
| `SUBMISSIONS_CLOSE` | Same format, or empty |
| `WINNERS_ANNOUNCED` | Same format, or empty |

Empty dates show as **TBD** and keep the forms open. Once a close date passes, that form closes automatically.
Then **Deployments → ⋯ → Redeploy** so the new values take effect.

### 6. Test before announcing
1. Register with your own `@ssidecisions.com` email, then submit a test entry.
2. Check both appear in `/admin` with a ✓ in the Backup column, and as rows in the Google Sheet.
3. Delete the test rows afterwards (Neon console → Tables, and the Sheet).

## If something goes wrong
- **Sheet rows missing:** `/admin` shows how many rows aren't in the Sheet yet; click **Re-send to Google Sheet**.
- **Vercel or the database is down:** the Google Sheet still has every row up to that point, and `/admin` offers CSV downloads at any time.
- **Someone overwrote a submission:** every version is kept. Download "all submission versions" from `/admin`, or check the Sheet.

## Editing content
All wording — objective, use cases, rubric, rules, prizes — is in `lib/config.ts`. The guide is `content/quickstart.md`. Commit and push; Vercel redeploys automatically.

## Run locally (optional)
```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL etc.
npm run dev                  # http://localhost:3000
```
