import type { Score, Screening, Submission } from "@/lib/db";
import { JUDGED, type JudgedKey } from "@/lib/judging";

export type Entry = Submission & { name: string; department: string };

export type Result = {
  s: Entry;
  screening: Screening | null;
  stage: "pending" | "filtered" | "passed";
  /** Judges' scores for this entry, one row per judge */
  rows: Score[];
  /** Average and number of judges for each judged criterion (Stages 2 and 3) */
  judged: Record<JudgedKey, { avg: number | null; count: number }>;
  /** Sum of the scores so far, out of 50 */
  total: number | null;
  /** True once Stage 1 passed and every judged criterion has at least one score */
  complete: boolean;
  rank: number | null;
  tied: boolean;
};

// Final score = Stage 1 Completeness + Stage 1 Technical + the average of each criterion judged in Stages 2 and 3
// (out of 50). Averages use the judges currently on that criterion's list who have scored it, so taking someone
// off a list also takes their scores out. Ranks go to complete entries only.
export function computeResults(
  subs: Entry[],
  screenings: Screening[],
  scores: Score[],
  lists: Map<JudgedKey, Map<string, string>>,
): Result[] {
  const byEntry = new Map(screenings.map((x) => [x.submission_email, x]));
  const results: Result[] = subs.map((s) => {
    const screening = byEntry.get(s.email) ?? null;
    const stage = screening ? screening.status : "pending";
    const rows = scores.filter((x) => x.submission_email === s.email);
    const judged = Object.fromEntries(
      JUDGED.map((c) => {
        const vals = rows
          .filter((r) => lists.get(c.key)?.has(r.judge))
          .map((r) => Number(r.scores?.[c.key]))
          .filter((v) => Number.isFinite(v) && v > 0);
        return [c.key, { avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, count: vals.length }];
      }),
    ) as Result["judged"];
    let total: number | null = null;
    let complete = false;
    if (stage === "passed" && screening) {
      const parts = [screening.completeness, screening.technical, ...JUDGED.map((c) => judged[c.key].avg)];
      total = parts.reduce<number>((a, v) => a + (v ?? 0), 0);
      complete = parts.every((v) => v !== null && v !== undefined);
    }
    return { s, screening, stage, rows, judged, total, complete, rank: null, tied: false };
  });

  const ranked = results.filter((r) => r.complete).sort((a, b) => b.total! - a.total!);
  const key = (r: Result) => r.total!.toFixed(2);
  ranked.forEach((r, i) => {
    r.rank = i > 0 && key(ranked[i - 1]) === key(r) ? ranked[i - 1].rank : i + 1;
    r.tied = ranked.some((o) => o !== r && key(o) === key(r));
  });
  const order = { passed: 0, pending: 1, filtered: 2 };
  return results.sort(
    (a, b) =>
      order[a.stage] - order[b.stage] ||
      Number(b.complete) - Number(a.complete) ||
      (b.total ?? -1) - (a.total ?? -1),
  );
}
