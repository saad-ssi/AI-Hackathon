import { LogoutButton } from "@/components/AdminActions";
import AdminLogin from "@/components/AdminLogin";
import ScoreForm from "@/components/ScoreForm";
import StaffRubric from "@/components/StaffRubric";
import { getJudge, judgeConfigured } from "@/lib/auth";
import { CRITERIA, SCORE_MAX, SCORE_MIN } from "@/lib/config";
import { ensureSchema, sql, type Score, type Submission } from "@/lib/db";
import { useCaseTitle } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Judging | Agent-A-Thon 2026", robots: { index: false } };

type SubRow = Submission & { name: string; department: string };

const MAX_TOTAL = CRITERIA.length * SCORE_MAX;
const criteria = CRITERIA.map((c) => ({ key: c.key, label: c.label }));

// Judges sign in here (email on the JUDGES list + the judge password) and score every entry.
export default async function Judge() {
  const judge = await getJudge();

  if (!judge) {
    return (
      <section className="section">
        <div className="wrap" style={{ maxWidth: 520 }}>
          <h1>Judging</h1>
          {judgeConfigured() ? (
            <AdminLogin role="judge" />
          ) : (
            <div className="alert err">Judging isn&apos;t set up yet. Please contact the organizers.</div>
          )}
        </div>
      </section>
    );
  }

  let subs: SubRow[] = [];
  let mineRows: Score[] = [];
  let dbError = "";
  try {
    await ensureSchema();
    const q = sql();
    subs = (await q`
      SELECT s.*, r.name, r.department
      FROM submissions s JOIN registrations r ON r.email = s.email
      ORDER BY s.updated_at DESC`) as SubRow[];
    mineRows = (await q`SELECT * FROM scores WHERE judge = ${judge.email}`) as Score[];
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const mine = new Map(mineRows.map((s) => [s.submission_email, s]));
  const toScore = [...subs].sort((a, b) => Number(mine.has(a.email)) - Number(mine.has(b.email))); // unscored first

  return (
    <section className="section">
      <div className="wrap">
        <div className="admin-head">
          <h1>Score the entries</h1>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <span className="muted small">Signed in as {judge.name} ({judge.email})</span>
            <LogoutButton role="judge" />
          </div>
        </div>
        {dbError && <div className="alert err">Database error: {dbError}</div>}

        <p className="muted">
          Open each live app, try it, then score every criterion. You can update your scores any time; other judges can&apos;t see them.
        </p>
        <StaffRubric />

        <p><strong>You&apos;ve scored {mine.size} of {subs.length} entries.</strong></p>
        {subs.length === 0 && <div className="closed">No submissions yet.</div>}
        <div className="grid">
          {toScore.map((s) => {
            const m = mine.get(s.email);
            return (
              <article key={s.email} className="card white entry-card">
                <div className="entry-head">
                  <div>
                    <h3>{s.project_name} {m && <span className="pill">Scored {m.total}/{MAX_TOTAL}</span>}</h3>
                    <p className="muted small">{s.name} · {s.department} · {useCaseTitle(s.use_case)}</p>
                  </div>
                  <div className="btn-row" style={{ marginTop: 0 }}>
                    <a className="btn" href={s.live_url} target="_blank" rel="noreferrer">Open live app ↗</a>
                    <a className="btn dark" href={s.repo_url} target="_blank" rel="noreferrer">GitHub ↗</a>
                  </div>
                </div>
                <p className="entry-summary">{s.pitch}</p>
                <ScoreForm email={s.email} criteria={criteria} min={SCORE_MIN} max={SCORE_MAX}
                  initial={m?.scores ?? null} initialComment={m?.comment ?? ""} />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
