import Rubric from "@/components/Rubric";
import { CRITERIA, SCORE_MAX, SCORE_MIN } from "@/lib/config";

function Intro() {
  return (
    <p className="muted small">
      Score each criterion from {SCORE_MIN} (weak) to {SCORE_MAX} (outstanding). All {CRITERIA.length} criteria count equally, so each
      judge&apos;s total is out of {CRITERIA.length * SCORE_MAX}; an entry&apos;s result is the average of its judges&apos; totals.
    </p>
  );
}

/** The scoring rubric: open on the judging page, folded on the admin page so the results stay near the top. */
export default function StaffRubric({ folded = false }: { folded?: boolean }) {
  if (folded) {
    return (
      <details className="fold staff-rubric">
        <summary>
          <span className="fold-title">Scoring rubric</span>
          <span className="fold-hint">Show</span>
        </summary>
        <Intro />
        <Rubric />
      </details>
    );
  }
  return (
    <div className="card white staff-rubric">
      <h3>Scoring rubric</h3>
      <Intro />
      <Rubric />
    </div>
  );
}
