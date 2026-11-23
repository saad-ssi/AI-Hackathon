import { LogoutButton } from "@/components/AdminActions";
import AdminLogin from "@/components/AdminLogin";
import ScreenForm from "@/components/ScreenForm";
import StaffRubric from "@/components/StaffRubric";
import { architectConfigured, architectName, getArchitect } from "@/lib/auth";
import { formatDate, getDates, outsideDates, SCORE_MAX, SCORE_MIN } from "@/lib/config";
import { ensureSchema, sql, type Screening } from "@/lib/db";
import { filterReasonLabel, STAGE1 } from "@/lib/judging";
import type { Entry } from "@/lib/results";
import { useCaseTitle } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stage 1 | Agent-A-Thon 2026", robots: { index: false } };

const groups = STAGE1.map((g) => ({ key: g.key, label: g.label, reasons: [...g.filteredOutIf] }));

// The AI Architect team signs in here (email on the ARCHITECTS list + the architect password), then filters
// each entry or passes it with one team score for Completeness and Technical execution. Stage 2 scores aren't shown.
export default async function Architect() {
  const architect = await getArchitect();

  if (!architect) {
    return (
      <section className="section">
        <div className="wrap" style={{ maxWidth: 520 }}>
          <h1>Stage 1: Architects</h1>
          {architectConfigured() ? (
            <AdminLogin role="architect" />
          ) : (
            <div className="alert err">Stage 1 isn&apos;t set up yet. Please contact the organizers.</div>
          )}
        </div>
      </section>
    );
  }

  const dates = getDates();
  let subs: Entry[] = [];
  let screenings: Screening[] = [];
  let dbError = "";
  try {
    await ensureSchema();
    const q = sql();
    subs = (await q`
      SELECT s.*, r.name, r.department
      FROM submissions s JOIN registrations r ON r.email = s.email
      ORDER BY s.submitted_at`) as Entry[];
    screenings = (await q`SELECT * FROM screenings`) as Screening[];
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const decided = new Map(screenings.map((x) => [x.submission_email, x]));
  const passed = screenings.filter((x) => x.status === "passed" && subs.some((s) => s.email === x.submission_email)).length;
  const filtered = screenings.filter((x) => x.status === "filtered" && subs.some((s) => s.email === x.submission_email)).length;
  const pending = subs.length - passed - filtered;
  const ordered = [...subs].sort((a, b) => Number(decided.has(a.email)) - Number(decided.has(b.email))); // pending first

  return (
    <section className="section">
      <div className="wrap">
        <div className="admin-head">
          <h1>Stage 1: filter and score</h1>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <span className="muted small" title={architect.email}>Signed in as <strong>{architect.name}</strong></span>
            <LogoutButton role="architect" />
          </div>
        </div>
        {dbError && <div className="alert err">Database error: {dbError}</div>}

        <div className="grid cols-4" style={{ marginBottom: 24 }}>
          <div className="tile dark"><div className="big">{subs.length}</div><div className="small">Submissions</div></div>
          <div className="tile red"><div className="big">{pending}</div><div className="small">Pending</div></div>
          <div className="tile dark"><div className="big">{passed}</div><div className="small">Passed to Stage 2</div></div>
          <div className="tile dark"><div className="big">{filtered}</div><div className="small">Filtered out</div></div>
        </div>

        <StaffRubric view="architect" />

        {subs.length === 0 && <div className="closed">No submissions yet.</div>}
        <div className="grid">
          {ordered.map((s) => {
            const d = decided.get(s.email);
            const late = outsideDates(s.submitted_at, dates.kickoff, null) || outsideDates(s.updated_at, null, dates.submissionsClose);
            return (
              <article key={s.email} className="card white entry-card">
                <div className="entry-head">
                  <div>
                    <h3>
                      {s.project_name}{" "}
                      {!d && <span className="pill grey">Pending</span>}
                      {d?.status === "passed" && <span className="pill green">Passed · {(d.completeness ?? 0) + (d.technical ?? 0)}/{SCORE_MAX * 2}</span>}
                      {d?.status === "filtered" && <span className="pill">Filtered out</span>}
                    </h3>
                    <p className="muted small">
                      {s.name} · {s.department} · {s.email} · {useCaseTitle(s.use_case)}
                      <br />
                      Submitted {formatDate(new Date(s.submitted_at))}
                      {s.version > 1 && <> · updated {formatDate(new Date(s.updated_at))} (version {s.version})</>}
                      {late && <> <span className="flag">Outside dates</span></>}
                    </p>
                  </div>
                  <div className="btn-row" style={{ marginTop: 0 }}>
                    <a className="btn" href={s.live_url} target="_blank" rel="noreferrer">Open live app ↗</a>
                    <a className="btn dark" href={s.repo_url} target="_blank" rel="noreferrer">GitHub ↗</a>
                  </div>
                </div>
                <p className="entry-summary">{s.pitch}</p>
                {d && (
                  <p className="muted small">
                    Last saved by {architectName(d.architect)} on {formatDate(new Date(d.updated_at))}
                    {d.status === "filtered" && d.reasons.length > 0 && <> · {d.reasons.map(filterReasonLabel).join("; ")}</>}
                  </p>
                )}
                <ScreenForm
                  key={d ? `${d.status}-${d.updated_at}` : "pending"}
                  email={s.email} groups={groups} min={SCORE_MIN} max={SCORE_MAX}
                  initial={d ? { status: d.status, reasons: d.reasons, note: d.note, completeness: d.completeness, technical: d.technical } : null}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
