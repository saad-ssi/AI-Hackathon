# Agent-A-Thon 2026 — Portal

Public site for SSI's Agent-A-Thon 2026: event info, use cases, rubric, the Vercel guide, registration and submission.

The public pages (`app/(site)/`) use the marketing team's retro arcade theme (`app/arcade.css`, `components/arcade/`), including its easter eggs: sound and CRT toggles, a score, 10 hidden coins across the pages, the Konami code, typing "agent" or "ship", and a game-over 404 page. `/admin` and `/judge` keep the plain SSI look, with no links back to the participant site (`components/StaffShell.tsx`).
Registrations and submissions are stored in a Neon Postgres database, which lives separately from the website itself.

| Page | Who | Purpose |
| --- | --- | --- |
| `/` | Public | Objective, key dates, at a glance, how it works, prizes |
| `/use-cases` | Public | Must-haves, 8 sample use cases, bring your own idea |
| `/rules` | Public | Rubric, judging panel, rules, tools |
| `/guide` | Public | Vercel quickstart (from `content/quickstart.md`) |
| `/register` | Public | Registration form (company emails only) |
| `/submit` | Public | Submission form; resubmits allowed until the deadline, every version kept |
| `/admin` | Admin email + password | Registrations, submissions, results and CSV downloads, with the scoring rubric |
| `/architect` | Architect email + password | Stage 1: the AI Architect team filters and scores each entry |
| `/judge` | Judge email + password | Stage 2: judges score Creativity & uniqueness and Business value |
| `/judge/stage-3` | Judge email + password | Stage 3: judges score Presentation & live product (may be at a live demo) |

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
| `ADMINS` | Who may use the admin view, as `email=Name` entries separated by commas, e.g. `sjoiya@ssidecisions.com=Saad, gali@ssidecisions.com=Gali` |
| `ARCHITECTS` | Stage 1, the AI Architect team on `/architect`, as `email=Name` entries separated by commas |
| `ARCHITECT_PASSWORD` | Optional password for `/architect`. If it's empty, architects use `JUDGE_PASSWORD` |
| `JUDGE_PASSWORD` | A different password you give the Stage 2 and Stage 3 judges |
| `CREATIVITY_JUDGES` | Stage 2 judges for Creativity & uniqueness, as `email=Name` entries separated by commas. The name is what the portal shows |
| `BUSINESS_JUDGES` | Stage 2 judges for Business value, same format |
| `PRESENTATION_JUDGES` | Stage 3 judges for Presentation & live product, same format |
| `JUDGES` | Only used if the three lists above are all empty: everyone listed then scores all three judged criteria |
| `ALLOWED_EMAIL_DOMAINS` | `ssidecisions.com` (comma-separate to allow more) |
| `REGISTRATION_OPENS` | Optional override, e.g. `2026-11-02T00:00:00+05:00` |
| `REGISTRATION_CLOSES` | Optional override, same format |
| `KICKOFF_AT` | Optional override, same format |
| `SUBMISSIONS_CLOSE` | Optional override, same format |
| `WINNERS_ANNOUNCED` | Optional override, same format |

The event dates are set in `lib/config.ts` (`DATES`), in Pakistan time, and every date on the site and in emails shows in Pakistan time (PKT). A date variable on Vercel overrides the one in the code; a date left empty in both shows as **TBD**. Winners show as "Mid-December 2026 (approx.)" until `WINNERS_ANNOUNCED` has a date.

**Forms stay open for now.** The dates are shown everywhere, but registration and submission work at any time so the portal can be tested; on `/admin`, any registration or submission made outside its dates is marked **Outside dates** for manual review. To make the forms follow the dates, add `ENFORCE_DATES=true` on Vercel and redeploy: registration is then open from `REGISTRATION_OPENS` to `REGISTRATION_CLOSES`, and submission only during the build weekend, from `KICKOFF_AT` to `SUBMISSIONS_CLOSE`.
Then **Deployments → ⋯ → Redeploy** so the new values take effect.

### 5. Emails (Amazon SES, required for registration)
Registration is confirmed by email: the portal sends a 6-digit code (valid 15 minutes, 5 tries, not copied to the organizers), and the person is registered only after entering it, so only real, reachable addresses can register. Codes waiting to be confirmed sit in the `pending_registrations` table. Registrations and submissions then each send a confirmation email, with a copy to the organizers. **Without these settings nobody can register**, because the code can't be sent; a failed confirmation email never blocks a registration or submission.

1. **Sender:** in the AWS console, open **Amazon SES → Identities → Create identity**. Best: verify the whole `ssidecisions.com` **domain** (IT adds the DKIM DNS records SES shows), so emails pass spam checks and can reach any colleague even while the account is in the SES sandbox. Quicker: verify a single address such as `hackathon@ssidecisions.com`, then request **production access** (SES → Account dashboard) so it can email unverified recipients.
2. **Key:** in **IAM → Users → Create user**, attach a policy that allows only `ses:SendEmail`, then create an **access key** for that user.
3. Add these in Vercel → **Environment Variables** (Vercel reserves the `AWS_*` names, so they use an `SES_` prefix), then redeploy:

| Name | Value |
| --- | --- |
| `SES_REGION` | The SES region you set up in, e.g. `us-east-1` |
| `SES_ACCESS_KEY_ID` | The IAM user's access key ID |
| `SES_SECRET_ACCESS_KEY` | The IAM user's secret access key |
| `EMAIL_FROM` | The verified sender: `AI Hackathon <alerts@ssidecisions.com>`. It's a no-reply address, and every email says so |
| `CONTACT_EMAIL` | Who emails tell people to contact with questions: `sjoiya@ssidecisions.com, gali@ssidecisions.com` (comma-separated) |
| `EMAIL_BCC` | Extra organizer inbox(es) that get a copy of every email (comma-separated). `gali@ssidecisions.com` always gets a copy (`ORGANIZER_COPIES` in `lib/config.ts`) |
| `SITE_URL` | `https://ssi-ai-hackathon.vercel.app` (used in email links) |

### 6. Test before announcing
1. Register with your own `@ssidecisions.com` email, then submit a test entry.
2. Check both appear in `/admin`, that the CSV downloads open in Excel, and (if emails are set up) that both confirmation emails arrive.
3. Delete the test rows afterwards (Neon console → **SQL Editor**): `TRUNCATE screenings, scores, submission_versions, submissions, registrations, pending_registrations RESTART IDENTITY;`

## Judging
Judging has three stages. The criteria are defined in `lib/judging.ts`; the participant pages still show `CRITERIA` from `lib/config.ts`.

**Stage 1, the AI Architect team (`/architect`).** Architects sign in with **their email** (listed in `ARCHITECTS`) and the architect password (`ARCHITECT_PASSWORD`, or `JUDGE_PASSWORD` if that's empty). For each entry they either:
- **filter it out**, ticking the reasons from the checklist and adding a short description of why, or
- **pass it**, with one team score from 1 to 10 for **Completeness** and one for **Technical execution**.

There is one decision per entry for the whole team. Any architect can change it, the last save wins, and the page shows who saved it. Decisions are stored in the `screenings` table. Only architects and admins see filter reasons, and participants are never told.

**Stages 2 and 3, upper management.** Judges sign in with **their email** and the **judge password**, and score only the criteria whose list they're on:
- **Stage 2 (`/judge`):** Creativity & uniqueness (`CREATIVITY_JUDGES`) and Business value (`BUSINESS_JUDGES`).
- **Stage 3 (`/judge/stage-3`):** Presentation & live product (`PRESENTATION_JUDGES`), which may be judged at a live demo.

Each page shows the judge their own progress in tiles at the top. A judge on both stages gets tabs to switch between them; a judge on only one stage is sent straight to it, so `/judge` is the one link to share. On both pages:
- Judges see every entry except those filtered out.
- An entry still waiting for Stage 1 shows its scoring greyed out, with the note "Stage 1 filtering and scoring pending from the AI Architect team".
- Judges never see Stage 1 scores, filter reasons or other judges' scores.
- They can update their own scores any time.

Each judge has one row per entry in the `scores` table. Saving one stage keeps their scores from the other; the Stage 3 comment is kept in `stage3_comment`. Removing someone from a list locks them out, and their scores for that criterion stop counting.

**Results (`/admin`).** Admins sign in with **their email** (listed in `ADMINS`) and the **admin password**. The final score, out of 50, is:
- Stage 1 Completeness + Technical execution, plus
- the average of each criterion judged in Stages 2 and 3, over the judges on its list who have scored it.

Only entries with every score in are ranked, and ties are flagged. Admins also see each judge's progress, entries waiting for Stage 1, the filtered-out list with reasons, and a breakdown for each project. There are CSV downloads for results, Stage 1 and the judges' Stage 2 and 3 scores.

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
