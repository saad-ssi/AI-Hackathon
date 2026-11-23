import { SCORE_MAX, SCORE_MIN } from "@/lib/config";
import { criteriaOf, FINAL_MAX, JUDGE_STAGES, SCALE, STAGE1, type JudgedKey, type JudgeStage } from "@/lib/judging";

function Scale() {
  return (
    <div className="scale">
      {SCALE.map((s) => (
        <div key={s.range} className="scale-item">
          <strong>{s.range} {s.label}</strong>
          <span className="muted">{s.text}</span>
        </div>
      ))}
    </div>
  );
}

function Stage1() {
  return (
    <div className="rubric-cards">
      {STAGE1.map((g, i) => (
        <div key={g.key} className="rubric-card">
          <h4><span className="rubric-num">{i + 1}</span>{g.label}</h4>
          <div className="rubric-label">Filtered out if</div>
          <ul>{g.filteredOutIf.map((r) => <li key={r.key}>{r.label}</li>)}</ul>
          {g.scoredOn.length > 0 && (
            <>
              <div className="rubric-label">Scored on</div>
              <ul>{g.scoredOn.map((t) => <li key={t}>{t}</li>)}</ul>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function Judged({ stage, only }: { stage: JudgeStage; only?: JudgedKey[] }) {
  const list = criteriaOf(stage).filter((c) => !only || only.includes(c.key));
  return (
    <div className="rubric-cards">
      {list.map((c, i) => (
        <div key={c.key} className="rubric-card">
          <h4><span className="rubric-num">{i + 1}</span>{c.label}</h4>
          <div className="rubric-label">Scored on</div>
          <ul>{c.scoredOn.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

/**
 * The rubric for each staff page:
 *   architect: Stage 1 filter checklists and the two team scores
 *   judge:     how to score, and only the criteria this judge scores in this stage
 *   admin:     the whole process, folded so the results stay near the top
 */
export default function StaffRubric({ view, stage = 2, criteria }: { view: "architect" | "judge" | "admin"; stage?: JudgeStage; criteria?: JudgedKey[] }) {
  if (view === "admin") {
    return (
      <details className="fold staff-rubric">
        <summary>
          <span className="fold-title">How entries are judged</span>
          <span className="fold-hint">Show</span>
        </summary>
        <ul className="stage-steps">
          <li>
            <strong>Stage 1, AI Architect team:</strong> filter out entries that break a rule, or give one team score for{" "}
            <em>Completeness</em> and one for <em>Technical execution</em>.
          </li>
          <li>
            <strong>Stage 2, upper management:</strong> <em>Creativity &amp; uniqueness</em> and <em>Business value</em>, on entries that
            passed Stage 1.
          </li>
          <li>
            <strong>Stage 3, upper management:</strong> <em>Presentation &amp; live product</em>, which may be judged at a live demo.
          </li>
          <li>
            In Stages 2 and 3, each judge scores <strong>only their own criteria</strong>. <strong>Final score</strong> = the two Stage 1 scores
            + the average of each judged criterion, <strong>out of {FINAL_MAX}</strong>.
          </li>
        </ul>
        <h4>Stage 1</h4>
        <Stage1 />
        <h4>{JUDGE_STAGES[2].title}</h4>
        <Judged stage={2} />
        <h4>{JUDGE_STAGES[3].title}</h4>
        <Judged stage={3} />
        <h4>Scale ({SCORE_MIN} to {SCORE_MAX})</h4>
        <Scale />
      </details>
    );
  }

  if (view === "architect") {
    return (
      <div className="card white staff-rubric">
        <h3>Stage 1 checklist</h3>
        <p className="muted small">
          Filter out any entry that meets a condition below, with a short description of why (only architects and admins see it; participants
          aren&apos;t told). Entries that pass get one team score from {SCORE_MIN} to {SCORE_MAX} for Completeness and one for Technical
          execution, then move on to Stage 2. Any architect can save or change an entry&apos;s decision.
        </p>
        <Stage1 />
        <Scale />
      </div>
    );
  }

  return (
    <div className="card white staff-rubric">
      <div className="how-grid">
        <div>
          <h3>How to score</h3>
          <ol className="how-steps">
            {stage === 3 ? (
              <li>
                <strong>Watch the presentation and open the live app.</strong> <em>This may be a live demo,</em> so you can score while the
                participant presents or straight after.
              </li>
            ) : (
              <li><strong>Open each live app and try it,</strong> then score your criteria.</li>
            )}
            <li>Score each of your criteria from <strong>{SCORE_MIN} to {SCORE_MAX}</strong>, using the scale below.</li>
            <li>
              You can <strong>update your scores any time</strong>. <em>Other judges can&apos;t see them.</em>
            </li>
          </ol>
          <p className="muted small">
            Each criterion&apos;s result is <em>the average of its judges&apos; scores</em>. Entries become available to score{" "}
            <strong>once the AI Architect team has filtered and scored them in Stage 1.</strong>
          </p>
        </div>
        <div>
          <h3>Your {criteria && criteria.length === 1 ? "criterion" : "criteria"}</h3>
          <Judged stage={stage} only={criteria} />
        </div>
      </div>
      <Scale />
    </div>
  );
}
