import AdminActions, { LogoutButton } from "@/components/AdminActions";
import AdminLogin from "@/components/AdminLogin";
import ScoreForm from "@/components/ScoreForm";
import { adminConfigured, getAdmin, getJudge, judgeConfigured, judgeList } from "@/lib/auth";
import { CRITERIA, SCORE_MAX, SCORE_MIN } from "@/lib/config";
import { ensureSchema, sql, type Registration, type Score, type Submission } from "@/lib/db";
import { useCaseTitle } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin & judging | AI Hackathon 2026", robots: { index: false } };

type SubRow = Submission & { name: string; department: string };

function fmt(ts: string) {
  return new Date(ts).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

const MAX_TOTAL = CRITERIA.length * SCORE_MAX;
const criteria = CRITERIA.map((c) => ({ key: c.key, label: c.label }));

export default async function Admin() {
  const [admin, judge] = await Promise.all([getAdmin(), getJudge()]);

  if (!admin && !judge) {
    return (
      <section className="section">
        <div className="wrap" style={{ maxWidth: 520 }}>
          <h1>Admin &amp; judging</h1>
          {!adminConfigured() && (
            <div className="alert err">
              No admins are set up yet. Add ADMIN_PASSWORD and an ADMINS list in Vercel&apos;s Environment Variables, then redeploy.
            </div>
          )}
          {(adminConfigured() || judgeConfigured()) && <AdminLogin />}
        </div>
      </section>
    );
  }

  let regs: Registration[] = [];
  let subs: SubRow[] = [];
  let scores: Score[] = [];
  let dbError = "";
  try {
    await ensureSchema();
    const q = sql();
    subs = (await q`
      SELECT s.*, r.name, r.department
      FROM submissions s JOIN registrations r ON r.email = s.email
      ORDER BY s.updated_at DESC`) as SubRow[];
    scores = (await q`SELECT * FROM scores`) as Score[];
    if (admin) regs = (await q`SELECT * FROM registrations ORDER BY created_at DESC`) as Registration[];
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  // ---------- Judge view: score every entry ----------
  const mine = new Map(scores.filter((s) => s.judge === judge?.email).map((s) => [s.submission_email, s]));
  const toScore = [...subs].sort((a, b) => Number(mine.has(a.email)) - Number(mine.has(b.email))); // unscored first

  // ---------- Admin view: results across judges ----------
  // Judge columns: everyone listed in JUDGES (in that order), plus anyone who scored but has since been removed
  const judges = judgeList();
  const judgeCols = [
    ...[...judges].map(([email, name]) => ({ email, name })),
    ...[...new Set(scores.map((x) => x.judge))].filter((e) => !judges.has(e)).map((email) => ({ email, name: `${email} (removed)` })),
  ];
  const results = subs
    .map((s) => {
      const rows = scores.filter((x) => x.submission_email === s.email);
      const avg = (f: (x: Score) => number) => (rows.length ? rows.reduce((a, x) => a + f(x), 0) / rows.length : null);
      return {
        s,
        rows,
        byJudge: new Map(rows.map((x) => [x.judge, x])),
        judges: rows.length,
        total: avg((x) => x.total),
        perCriterion: CRITERIA.map((c) => avg((x) => Number(x.scores?.[c.key]) || 0)),
      };
    })
    .sort((a, b) => (b.total ?? -1) - (a.total ?? -1));
  // Every listed judge, with how many entries each has scored (stored scores are keyed by judge email)
  const judgeProgress = [...judges].map(([email, name]) => ({
    email, name, scored: scores.filter((x) => x.judge === email).length,
  }));
  const judgesWhoScored = new Set(scores.map((s) => s.judge)).size;

  return (
    <section className="section">
      <div className="wrap">
        <div className="admin-head">
          <h1>Admin &amp; judging</h1>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <span className="muted small">
              Signed in as {[admin && `admin: ${admin.name} (${admin.email})`, judge && `judge: ${judge.name} (${judge.email})`].filter(Boolean).join(" · ")}
            </span>
            <LogoutButton />
          </div>
        </div>
        {dbError && <div className="alert err">Database error: {dbError}</div>}

        {judge && (
          <>
            <h2>Score the entries</h2>
            <p className="muted">
              Open each live app, try it, then score every criterion from {SCORE_MIN} (weak) to {SCORE_MAX} (outstanding). All
              criteria count equally. You can update your scores any time; other judges can&apos;t see them.
            </p>
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
          </>
        )}

        {admin && (
          <>
            {judge && <h2 style={{ marginTop: 48 }}>Event overview</h2>}
            <div className="grid cols-4" style={{ marginBottom: 24 }}>
              <div className="tile red"><div className="big">{regs.length}</div><div className="small">Registrations</div></div>
              <div className="tile dark"><div className="big">{subs.length}</div><div className="small">Submissions</div></div>
              <div className="tile red"><div className="big">{judgesWhoScored}/{judges.size}</div><div className="small">Judges who have scored</div></div>
              <div className="tile dark"><div className="big">{scores.length}</div><div className="small">Scores saved</div></div>
            </div>
            <AdminActions />

            <h2 style={{ marginTop: 40 }}>Results</h2>
            <p className="muted small">
              Average of each judge&apos;s total (out of {MAX_TOTAL}), all criteria equal.
            </p>
            <p className="small">
              <strong>Judges:</strong>{" "}
              {judgeProgress.length === 0
                ? "none listed yet. Add them to the JUDGES setting in Vercel."
                : judgeProgress.map((j) => `${j.name} (${j.scored}/${subs.length} scored)`).join(" · ")}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th><th>Project</th><th>Participant</th>
                    {judgeCols.map((j) => <th key={j.email} title={j.email}>{j.name}</th>)}
                    <th>Average total</th><th>Judges</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 && <tr><td colSpan={5 + judgeCols.length} className="muted">No submissions yet.</td></tr>}
                  {results.map((r, i) => (
                    <tr key={r.s.email}>
                      <td>{r.total === null ? "–" : i + 1}</td>
                      <td>{r.s.project_name}</td>
                      <td>{r.s.name}</td>
                      {judgeCols.map((j) => <td key={j.email}>{r.byJudge.get(j.email)?.total ?? "–"}</td>)}
                      <td><strong>{r.total === null ? "Not scored" : r.total.toFixed(1)}</strong></td>
                      <td>{r.judges}/{judges.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={{ marginTop: 28 }}>Score breakdown by project</h3>
            <p className="muted small">Each judge&apos;s score per criterion (1–{SCORE_MAX}) and comment, with the averages.</p>
            {results.filter((r) => r.rows.length > 0).length === 0 && <p className="muted">No scores yet.</p>}
            {results.filter((r) => r.rows.length > 0).map((r) => (
              <details key={r.s.email} className="fold">
                <summary>
                  <span className="fold-title">{r.s.project_name} <span className="muted small">· {r.s.name} · average {r.total?.toFixed(1)}/{MAX_TOTAL}</span></span>
                  <span className="fold-hint">Show</span>
                </summary>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Judge</th>
                        {CRITERIA.map((c) => <th key={c.key} title={c.label}>{c.label.split(" (")[0]}</th>)}
                        <th>Total</th><th>Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {judgeCols.filter((j) => r.byJudge.has(j.email)).map((j) => {
                        const x = r.byJudge.get(j.email)!;
                        return (
                          <tr key={j.email}>
                            <td>{j.name}</td>
                            {CRITERIA.map((c) => <td key={c.key}>{x.scores?.[c.key] ?? "–"}</td>)}
                            <td><strong>{x.total}</strong></td>
                            <td style={{ minWidth: 220 }}>{x.comment || <span className="muted">–</span>}</td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td><strong>Average</strong></td>
                        {r.perCriterion.map((v, k) => <td key={k}><strong>{v === null ? "–" : v.toFixed(1)}</strong></td>)}
                        <td><strong>{r.total?.toFixed(1)}</strong></td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </details>
            ))}

            <h2 style={{ marginTop: 40 }}>Submissions</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Project</th><th>Use case</th><th>Live URL</th><th>Repo</th><th>Summary</th><th>Ver.</th><th>Updated</th></tr>
                </thead>
                <tbody>
                  {subs.length === 0 && <tr><td colSpan={8} className="muted">No submissions yet.</td></tr>}
                  {subs.map((s) => (
                    <tr key={s.email}>
                      <td>{s.name}<br /><span className="muted">{s.email}</span></td>
                      <td>{s.project_name}</td>
                      <td>{useCaseTitle(s.use_case)}</td>
                      <td><a href={s.live_url} target="_blank" rel="noreferrer">{s.live_url.replace("https://", "")}</a></td>
                      <td><a href={s.repo_url} target="_blank" rel="noreferrer">GitHub</a></td>
                      <td style={{ minWidth: 280 }}>{s.pitch}</td>
                      <td>{s.version}</td>
                      <td>{fmt(s.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 style={{ marginTop: 40 }}>Registrations</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Department</th><th>Registered</th><th>Submitted</th></tr>
                </thead>
                <tbody>
                  {regs.length === 0 && <tr><td colSpan={5} className="muted">No registrations yet.</td></tr>}
                  {regs.map((r) => (
                    <tr key={r.email}>
                      <td>{r.name}</td>
                      <td>{r.email}</td>
                      <td>{r.department}</td>
                      <td>{fmt(r.created_at)}</td>
                      <td>{subs.some((s) => s.email === r.email) ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
