import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/AdminActions";
import AdminLogin from "@/components/AdminLogin";
import ScoreForm from "@/components/ScoreForm";
import StaffRubric from "@/components/StaffRubric";
import { getJudge, judgeConfigured, judgeCriteria, judgeStages } from "@/lib/auth";
import { SCORE_MAX, SCORE_MIN } from "@/lib/config";
import { ensureSchema, sql, type Score } from "@/lib/db";
import { JUDGE_STAGES, JUDGED, type JudgedKey, type JudgeStage } from "@/lib/judging";
import type { Entry } from "@/lib/results";
import { useCaseTitle } from "@/lib/validate";

type Row = Entry & { stage1: "passed" | "filtered" | null };

const WAITING = "Stage 1 filtering and scoring pending from the AI Architect team.";

// The judging page for Stage 2 (/judge) and Stage 3 (/judge/stage-3). Judges sign in with their email (on a judges
// list) + the judge password. They see every entry except those filtered out in Stage 1, and score only their own
// criteria in this stage once Stage 1 is done. They never see Stage 1 scores, filter reasons or other judges' scores.
export default async function JudgeStagePage({ stage }: { stage: JudgeStage }) {
  const info = JUDGE_STAGES[stage];
  const judge = await getJudge();

  if (!judge) {
    return (
      <section className="section">
        <div className="wrap" style={{ maxWidth: 520 }}>
          <p className="stage-eyebrow">Judging</p>
          <h1>Sign in to score</h1>
          {judgeConfigured() ? (
            <AdminLogin role="judge" />
          ) : (
            <div className="alert err">Judging isn&apos;t set up yet. Please contact the organizers.</div>
          )}
        </div>
      </section>
    );
  }

  // Send judges who only score in the other stage straight to it
  const stages = judgeStages(judge.email);
  if (stages.length > 0 && !stages.includes(stage)) redirect(JUDGE_STAGES[stages[0]].path);

  const keysFor = (st: JudgeStage) => judgeCriteria(judge.email, st);
  const mineKeys = keysFor(stage);
  const criteria = JUDGED.filter((c) => mineKeys.includes(c.key)).map((c) => ({ key: c.key, label: c.label }));

  let entries: Row[] = [];
  let mineRows: Score[] = [];
  let dbError = "";
  try {
    await ensureSchema();
    const q = sql();
    // Only the Stage 1 status is read here, never the architects' scores or notes
    entries = (await q`
      SELECT s.*, r.name, r.department, sc.status AS stage1
      FROM submissions s
      JOIN registrations r ON r.email = s.email
      LEFT JOIN screenings sc ON sc.submission_email = s.email
      WHERE sc.status IS DISTINCT FROM 'filtered'
      ORDER BY s.submitted_at`) as Row[];
    mineRows = (await q`SELECT * FROM scores WHERE judge = ${judge.email}`) as Score[];
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const mine = new Map(mineRows.map((s) => [s.submission_email, s]));
  const ready = entries.filter((e) => e.stage1 === "passed");
  const waiting = entries.filter((e) => e.stage1 !== "passed");
  const scoredIn = (keys: JudgedKey[], e: Row) => {
    const m = mine.get(e.email);
    return Boolean(m && keys.length > 0 && keys.every((k) => Number(m.scores?.[k]) > 0));
  };
  const isScored = (e: Row) => scoredIn(mineKeys, e);
  const todo = ready.filter((e) => !isScored(e));
  const done = ready.filter(isScored);
  const leftIn = (st: JudgeStage) => ready.filter((e) => !scoredIn(keysFor(st), e)).length;
  const commentOf = (m: Score | undefined) => (stage === 3 ? m?.stage3_comment : m?.comment) ?? "";

  const card = (s: Row) => {
    const open = s.stage1 === "passed";
    const m = mine.get(s.email);
    return (
      <article key={s.email} className={`card white entry-card ${open ? "" : "waiting"}`}>
        <div className="entry-head">
          <div>
            <h3>
              {s.project_name}{" "}
              {open && isScored(s) && <span className="pill green">Scored</span>}
              {!open && <span className="pill grey">Stage 1 pending</span>}
            </h3>
            <p className="muted small"><strong>{s.name}</strong> · {s.department} · <em>{useCaseTitle(s.use_case)}</em></p>
          </div>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <a className="btn" href={s.live_url} target="_blank" rel="noreferrer">Open live app ↗</a>
            <a className="btn dark" href={s.repo_url} target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
        </div>
        <p className="entry-summary">{s.pitch}</p>
        {criteria.length > 0 && (
          <ScoreForm
            email={s.email} stage={stage} criteria={criteria} min={SCORE_MIN} max={SCORE_MAX}
            initial={open ? m?.scores ?? null : null} initialComment={open ? commentOf(m) : ""}
            disabledNote={open ? undefined : WAITING}
          />
        )}
      </article>
    );
  };

  return (
    <section className="section">
      <div className="wrap">
        <div className="admin-head">
          <div>
            <p className="stage-eyebrow">Judging · Stage {stage}</p>
            <h1>{info.short}</h1>
          </div>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <span className="muted small" title={judge.email}>Signed in as <strong>{judge.name}</strong></span>
            <LogoutButton role="judge" />
          </div>
        </div>
        {dbError && <div className="alert err">Database error: {dbError}</div>}
        {stages.length === 0 && (
          <div className="alert err">You haven&apos;t been assigned any criteria yet. Please contact the organizers.</div>
        )}

        {stages.length > 1 && (
          <nav className="stage-tabs" aria-label="Judging stages">
            {stages.map((st) => {
              const left = leftIn(st);
              return (
                <Link key={st} href={JUDGE_STAGES[st].path} className={`stage-tab ${st === stage ? "on" : ""}`} aria-current={st === stage ? "page" : undefined}>
                  <span className="stage-tab-num">Stage {st}</span>
                  <span className="stage-tab-name">{JUDGE_STAGES[st].short}</span>
                  <span className={`pill ${left === 0 ? "green" : ""}`}>{left === 0 ? "Done ✓" : `${left} left`}</span>
                </Link>
              );
            })}
          </nav>
        )}

        <div className="grid cols-4" style={{ marginBottom: 24 }}>
          <div className="tile red"><div className="big">{todo.length}</div><div className="small">Left for you to score</div></div>
          <div className="tile dark"><div className="big">{done.length}/{ready.length}</div><div className="small">Scored by you</div></div>
          <div className="tile dark"><div className="big">{ready.length}</div><div className="small">Ready to score (passed Stage 1)</div></div>
          <div className="tile light"><div className="big">{waiting.length}</div><div className="small">Waiting for Stage 1</div></div>
        </div>

        <StaffRubric view="judge" stage={stage} criteria={mineKeys} />

        {entries.length === 0 && <div className="closed">No submissions yet.</div>}

        {ready.length > 0 && (
          <>
            <h2 className="entry-group">To score <span className="count">{todo.length}</span></h2>
            {todo.length === 0 ? (
              <p className="all-done"><strong>All done.</strong> You&apos;ve scored every entry that&apos;s ready. <em>You can still update any score below.</em></p>
            ) : (
              <div className="grid">{todo.map(card)}</div>
            )}
          </>
        )}

        {done.length > 0 && (
          <>
            <h2 className="entry-group">Scored by you <span className="count">{done.length}</span></h2>
            <div className="grid">{done.map(card)}</div>
          </>
        )}

        {waiting.length > 0 && (
          <>
            <h2 className="entry-group">Waiting for Stage 1 <span className="count">{waiting.length}</span></h2>
            <p className="muted small"><em>You&apos;ll be able to score these once the AI Architect team has filtered and scored them.</em></p>
            <div className="grid">{waiting.map(card)}</div>
          </>
        )}
      </div>
    </section>
  );
}
