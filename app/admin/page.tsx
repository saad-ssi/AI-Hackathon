import AdminActions, { LogoutButton } from "@/components/AdminActions";
import AdminLogin from "@/components/AdminLogin";
import StaffRubric from "@/components/StaffRubric";
import { adminConfigured, architectList, architectName, getAdmin, judgeCriteria, judgedJudges, judgeList, judgeStages } from "@/lib/auth";
import { formatDate, getDates, outsideDates } from "@/lib/config";
import { ensureSchema, sql, type Registration, type Score, type Screening } from "@/lib/db";
import { criteriaOf, FINAL_MAX, filterReasonLabel, JUDGE_STAGES, JUDGED, judgedLabel, type JudgeStage } from "@/lib/judging";
import { computeResults, type Entry, type Result } from "@/lib/results";
import { useCaseTitle } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | Agent-A-Thon 2026", robots: { index: false } };

function fmt(ts: string) {
  return formatDate(new Date(ts));
}

function OutsideDates() {
  return <><br /><span className="flag">Outside dates</span></>;
}

function Progress({ done, of }: { done: number; of: number }) {
  const pct = of === 0 ? 0 : Math.round((done / of) * 100);
  return (
    <>
      <span className={`progress-bar ${of > 0 && done === of ? "full" : ""}`}><span style={{ width: `${pct}%` }} /></span>
      <strong>{done}/{of}</strong>
    </>
  );
}

const one = (v: number | null | undefined) => (v === null || v === undefined ? "–" : Number.isInteger(v) ? String(v) : v.toFixed(1));
const STAGES: JudgeStage[] = [2, 3];

// Admins sign in here (email on the ADMINS list + the admin password). Architects screen on /architect;
// judges score on /judge (Stage 2) and /judge/stage-3 (Stage 3).
export default async function Admin() {
  const admin = await getAdmin();

  if (!admin) {
    return (
      <section className="section">
        <div className="wrap" style={{ maxWidth: 520 }}>
          <h1>Admin</h1>
          {!adminConfigured() && (
            <div className="alert err">
              No admins are set up yet. Add ADMIN_PASSWORD and an ADMINS list in Vercel&apos;s Environment Variables, then redeploy.
            </div>
          )}
          {adminConfigured() && <AdminLogin role="admin" />}
        </div>
      </section>
    );
  }

  const dates = getDates();
  let regs: Registration[] = [];
  let subs: Entry[] = [];
  let scores: Score[] = [];
  let screenings: Screening[] = [];
  let dbError = "";
  try {
    await ensureSchema();
    const q = sql();
    subs = (await q`
      SELECT s.*, r.name, r.department
      FROM submissions s JOIN registrations r ON r.email = s.email
      ORDER BY s.updated_at DESC`) as Entry[];
    scores = (await q`SELECT * FROM scores`) as Score[];
    screenings = (await q`SELECT * FROM screenings`) as Screening[];
    regs = (await q`SELECT * FROM registrations ORDER BY created_at DESC`) as Registration[];
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  // Results: Stage 1 team scores + the average of each criterion judged in Stages 2 and 3, out of 50
  const lists = judgedJudges();
  const results = computeResults(subs, screenings, scores, lists);
  const passed = results.filter((r) => r.stage === "passed");
  const waiting = results.filter((r) => r.stage === "pending");
  const filtered = results.filter((r) => r.stage === "filtered");
  const architects = [...architectList().values()];
  const judges = judgeList();
  const nameOf = (email: string) => judges.get(email) ?? email;

  // A stage is done for an entry once every judge on each of that stage's criteria lists has scored it
  const stageDone = (r: Result, st: JudgeStage) => criteriaOf(st).every((c) => r.judged[c.key].count >= (lists.get(c.key)?.size ?? 0));
  const judgeDone = (email: string, st: JudgeStage, r: Result) => {
    const keys = judgeCriteria(email, st);
    const row = r.rows.find((x) => x.judge === email);
    return Boolean(row && keys.every((k) => Number(row.scores?.[k]) > 0));
  };
  const panel = (st: JudgeStage) =>
    [...judges.keys()].filter((email) => judgeStages(email).includes(st)).map((email) => ({
      email,
      name: nameOf(email),
      criteria: judgeCriteria(email, st).map(judgedLabel),
      scored: passed.filter((r) => judgeDone(email, st, r)).length,
    }));

  return (
    <section className="section">
      <div className="wrap">
        <div className="admin-head">
          <h1>Admin</h1>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <span className="muted small" title={admin.email}>Signed in as <strong>{admin.name}</strong></span>
            <LogoutButton role="admin" />
          </div>
        </div>
        {dbError && <div className="alert err">Database error: {dbError}</div>}

        <>
            <div className="grid cols-4" style={{ marginBottom: 24 }}>
              <div className="tile dark"><div className="big">{regs.length}</div><div className="small">Registrations</div></div>
              <div className="tile dark"><div className="big">{subs.length}</div><div className="small">Submissions</div></div>
              <div className="tile red">
                <div className="big">{subs.length - waiting.length}/{subs.length}</div>
                <div className="small"><strong>Stage 1 done</strong> · {passed.length} passed, {filtered.length} filtered out</div>
              </div>
              {STAGES.map((st) => (
                <div key={st} className="tile red">
                  <div className="big">{passed.filter((r) => stageDone(r, st)).length}/{passed.length}</div>
                  <div className="small"><strong>Stage {st} done</strong> · scored by every judge</div>
                </div>
              ))}
            </div>
            <AdminActions />

            <p className="muted small" style={{ marginTop: 12 }}>
              <strong>Stage 1:</strong> architects filter and score on <code>/architect</code>. <strong>Stage 2:</strong> judges score Creativity
              and Business value on <code>/judge</code>. <strong>Stage 3:</strong> judges score Presentation &amp; live product on{" "}
              <code>/judge/stage-3</code>. <em>Judges never see Stage 1 scores, filter reasons or each other&apos;s scores.</em>
            </p>

            <h2 style={{ marginTop: 40 }}>Judging progress</h2>
            <div className="table-wrap">
              <table className="progress-table">
                <thead><tr><th>Stage</th><th>Who</th><th>Scores</th><th>Progress</th></tr></thead>
                <tbody>
                  <tr>
                    <td><strong>Stage 1</strong></td>
                    <td>
                      AI Architect team
                      <br />
                      <span className="muted small">
                        {architects.length === 0 ? "None listed yet. Add them to the ARCHITECTS setting in Vercel." : architects.join(", ")}
                      </span>
                    </td>
                    <td>Completeness, Technical execution <span className="muted small">(one team score per entry)</span></td>
                    <td><Progress done={subs.length - waiting.length} of={subs.length} /> <span className="muted small">decided</span></td>
                  </tr>
                  {STAGES.map((st) => {
                    const people = panel(st);
                    if (people.length === 0) {
                      return (
                        <tr key={st}>
                          <td><strong>Stage {st}</strong></td>
                          <td colSpan={3} className="muted">
                            No judges listed yet. Add them to {criteriaOf(st).map((c) => c.listVar).join(" and ")} in Vercel.
                          </td>
                        </tr>
                      );
                    }
                    return people.map((j, i) => (
                      <tr key={`${st}-${j.email}`}>
                        <td>{i === 0 && <strong>Stage {st}</strong>}</td>
                        <td title={j.email}>{j.name}</td>
                        <td>{j.criteria.join(", ")}</td>
                        <td><Progress done={j.scored} of={passed.length} /> <span className="muted small">scored</span></td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>

            <h2 style={{ marginTop: 40 }}>Results</h2>
            <p className="muted small">
              <strong>Final score</strong> = Stage 1 Completeness + Technical execution (the architects&apos; team scores) + the average of each
              criterion judged in Stages 2 and 3, <strong>out of {FINAL_MAX}</strong>. <em>Only entries with every score in are ranked.</em> Ties
              go to Shoaib and Shahab. Numbers in brackets are how many of that criterion&apos;s judges have scored.
            </p>
            <StaffRubric view="admin" />
            <div className="table-wrap">
              <table className="results-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Rank</th><th rowSpan={2}>Project</th><th rowSpan={2}>Participant</th>
                    <th colSpan={2} className="group s1">Stage 1</th>
                    {STAGES.map((st) => <th key={st} colSpan={criteriaOf(st).length} className="group">Stage {st}</th>)}
                    <th rowSpan={2} className="final">Final / {FINAL_MAX}</th>
                  </tr>
                  <tr>
                    <th>Completeness</th><th>Technical</th>
                    {JUDGED.map((c) => <th key={c.key}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {passed.length === 0 && <tr><td colSpan={6 + JUDGED.length} className="muted">No entries have passed Stage 1 yet.</td></tr>}
                  {passed.map((r) => (
                    <tr key={r.s.email}>
                      <td><strong>{r.rank ?? "–"}</strong>{r.tied && <><br /><span className="flag">Tie</span></>}</td>
                      <td>{r.s.project_name}</td>
                      <td>{r.s.name}</td>
                      <td>{one(r.screening?.completeness)}</td>
                      <td>{one(r.screening?.technical)}</td>
                      {JUDGED.map((c) => (
                        <td key={c.key}>{one(r.judged[c.key].avg)} <span className="muted small">({r.judged[c.key].count}/{lists.get(c.key)?.size ?? 0})</span></td>
                      ))}
                      <td className="final"><strong>{r.total === null ? "–" : r.total.toFixed(1)}</strong>{!r.complete && <><br /><span className="muted small"><em>in progress</em></span></>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={{ marginTop: 28 }}>Waiting for Stage 1 <span className="muted small">({waiting.length})</span></h3>
            {waiting.length === 0 ? <p className="muted">None.</p> : (
              <p>{waiting.map((r) => `${r.s.project_name} (${r.s.name})`).join(" · ")}</p>
            )}

            <h3 style={{ marginTop: 28 }}>Filtered out in Stage 1 <span className="muted small">({filtered.length})</span></h3>
            <p className="muted small"><em>Only architects and admins see this. Participants aren&apos;t told.</em></p>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Project</th><th>Participant</th><th>Reasons</th><th>Description</th><th>By</th></tr></thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan={5} className="muted">None.</td></tr>}
                  {filtered.map((r) => (
                    <tr key={r.s.email}>
                      <td>{r.s.project_name}</td>
                      <td>{r.s.name}</td>
                      <td>{r.screening!.reasons.map(filterReasonLabel).join("; ") || "–"}</td>
                      <td style={{ minWidth: 220 }}>{r.screening!.note}</td>
                      <td>{architectName(r.screening!.architect)}<br /><span className="muted small">{fmt(r.screening!.updated_at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={{ marginTop: 28 }}>Score breakdown by project</h3>
            <p className="muted small">
              Stage 1 team scores and notes, then each judge&apos;s Stage 2 and Stage 3 scores (only their own criteria) and comments.
            </p>
            {passed.length === 0 && <p className="muted">No entries have passed Stage 1 yet.</p>}
            {passed.map((r) => (
              <details key={r.s.email} className="fold">
                <summary>
                  <span className="fold-title">{r.s.project_name} <span className="muted small">· {r.s.name} · {r.total?.toFixed(1)}/{FINAL_MAX}{!r.complete && " (in progress)"}</span></span>
                  <span className="fold-hint">Show</span>
                </summary>
                <p className="small">
                  <strong>Stage 1:</strong> Completeness <strong>{one(r.screening?.completeness)}</strong>, Technical execution{" "}
                  <strong>{one(r.screening?.technical)}</strong>
                  {" "}<span className="muted">(saved by {architectName(r.screening!.architect)}, {fmt(r.screening!.updated_at)})</span>
                  {r.screening?.note && <><br /><span className="muted">Note: <em>{r.screening.note}</em></span></>}
                </p>
                {STAGES.map((st) => {
                  const cs = criteriaOf(st);
                  const rows = r.rows.filter((x) => cs.some((c) => Number(x.scores?.[c.key]) > 0));
                  return (
                    <div key={st}>
                      <h4>{JUDGE_STAGES[st].title}</h4>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr><th>Judge</th>{cs.map((c) => <th key={c.key}>{c.label}</th>)}<th>Comment</th></tr>
                          </thead>
                          <tbody>
                            {rows.length === 0 && <tr><td colSpan={2 + cs.length} className="muted">No Stage {st} scores yet.</td></tr>}
                            {rows.map((x) => (
                              <tr key={x.judge}>
                                <td title={x.judge}>
                                  {nameOf(x.judge)}
                                  {cs.some((c) => x.scores?.[c.key] && !lists.get(c.key)?.has(x.judge)) && (
                                    <><br /><span className="muted small"><em>no longer on this list, not counted</em></span></>
                                  )}
                                </td>
                                {cs.map((c) => <td key={c.key}>{x.scores?.[c.key] ?? "–"}</td>)}
                                <td style={{ minWidth: 220 }}>{(st === 3 ? x.stage3_comment : x.comment) || <span className="muted">–</span>}</td>
                              </tr>
                            ))}
                            <tr>
                              <td><strong>Average</strong></td>
                              {cs.map((c) => <td key={c.key}><strong>{one(r.judged[c.key].avg)}</strong></td>)}
                              <td />
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
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
                      <td>
                        {fmt(s.updated_at)}
                        {(outsideDates(s.submitted_at, dates.kickoff, null) || outsideDates(s.updated_at, null, dates.submissionsClose)) && <OutsideDates />}
                      </td>
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
                      <td>
                        {fmt(r.created_at)}
                        {outsideDates(r.created_at, dates.registrationOpens, dates.registrationCloses) && <OutsideDates />}
                      </td>
                      <td>{subs.some((s) => s.email === r.email) ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </>
      </div>
    </section>
  );
}
