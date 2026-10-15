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
| `/admin` | Password | Admins: registrations, submissions, results and CSV downloads. Judges: score each entry |

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
| `JUDGE_PASSWORD` | A different password you give the judges |
| `JUDGES` | Who may judge, as `email=Name` entries separated by commas, e.g. `jane@ssidecisions.com=Jane Smith, gali@ssidecisions.com=Gali` |
| `ALLOWED_EMAIL_DOMAINS` | `ssidecisions.com` (comma-separate to allow more) |
| `EVENT_TIMEZONE` | e.g. `America/Los_Angeles` or `Asia/Karachi` |
| `REGISTRATION_CLOSES` | e.g. `2026-11-13T18:00:00-08:00`, or leave empty for TBD |
| `KICKOFF_AT` | Same format, or empty |
| `SUBMISSIONS_CLOSE` | Same format, or empty |
| `WINNERS_ANNOUNCED` | Same format, or empty |

Empty dates show as **TBD** and keep the forms open. Once a close date passes, that form closes automatically.
Then **Deployments → ⋯ → Redeploy** so the new values take effect.

### 5. Confirmation emails (Amazon SES, optional)
Registrations and submissions each send a confirmation email, with a copy to the organizers. Emails stay off until these settings exist; a failed email never blocks a registration or submission.

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
| `EMAIL_BCC` | Organizer inbox(es) that get a copy of every email (comma-separated) |
| `SITE_URL` | `https://ssi-ai-hackathon.vercel.app` (used in email links) |

### 6. Test before announcing
1. Register with your own `@ssidecisions.com` email, then submit a test entry.
2. Check both appear in `/admin`, that the CSV downloads open in Excel, and (if emails are set up) that both confirmation emails arrive.
3. Delete the test rows afterwards (Neon console → **SQL Editor**): `TRUNCATE scores, submission_versions, submissions, registrations RESTART IDENTITY;`

## Judging
Judges open `/admin` and sign in with **their email** (it must be listed in `JUDGES`) and the **judge password**. They see every submission with links to the live app and repo. They score each of the five criteria from 1 to 10 (all equal) with an optional comment, and can update their scores any time. Judges see only their own scores. Scores are stored by judge email; the names shown come from `JUDGES`, and removing an email from `JUDGES` locks that judge out.
Admins (admin password) see a **Results** table: each entry's average total across judges (out of 50), the number of judges who scored it, per-criterion averages and a ranking, plus a scores CSV.

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
