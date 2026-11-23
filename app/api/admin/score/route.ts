import { getJudge, judgeCriteria } from "@/lib/auth";
import { SCORE_MAX, SCORE_MIN } from "@/lib/config";
import { ensureSchema, sql } from "@/lib/db";
import type { JudgeStage } from "@/lib/judging";
import { clean, normalizeEmail } from "@/lib/validate";

// Saves (or updates) the signed-in judge's scores for one entry in one stage (2 or 3): only the criteria they're
// assigned in that stage, and only once the entry has passed Stage 1. A judge has one row per entry, so saving one
// stage keeps their scores from the other.
export async function POST(req: Request) {
  const judge = await getJudge();
  if (!judge) return Response.json({ error: "Please sign in as a judge." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const stage: JudgeStage = Number(body.stage) === 3 ? 3 : 2;
  const mine = judgeCriteria(judge.email, stage);
  if (mine.length === 0) return Response.json({ error: `You haven't been assigned any Stage ${stage} criteria.` }, { status: 403 });

  const email = normalizeEmail(body.email);
  const comment = clean(body.comment, 1000);
  const scores: Record<string, number> = {};
  for (const key of mine) {
    const v = Number(body.scores?.[key]);
    if (!Number.isInteger(v) || v < SCORE_MIN || v > SCORE_MAX) {
      return Response.json({ error: `Please score each of your criteria from ${SCORE_MIN} to ${SCORE_MAX}.` }, { status: 400 });
    }
    scores[key] = v;
  }

  try {
    await ensureSchema();
    const q = sql();
    const rows = (await q`
      SELECT s.email, sc.status FROM submissions s
      LEFT JOIN screenings sc ON sc.submission_email = s.email
      WHERE s.email = ${email}`) as { email: string; status: string | null }[];
    if (rows.length === 0 || rows[0].status === "filtered") return Response.json({ error: "That submission isn't available to score." }, { status: 404 });
    if (rows[0].status !== "passed") {
      return Response.json({ error: "Stage 1 filtering and scoring is still pending from the AI Architect team." }, { status: 409 });
    }

    // Keep this judge's scores from the other stage, dropping any criterion they're no longer assigned
    const assigned = judgeCriteria(judge.email) as string[];
    const before = (await q`SELECT scores FROM scores WHERE submission_email = ${email} AND judge = ${judge.email}`) as { scores: Record<string, number> }[];
    const merged = Object.fromEntries(Object.entries({ ...(before[0]?.scores ?? {}), ...scores }).filter(([k]) => assigned.includes(k)));
    const total = Object.values(merged).reduce((a, b) => a + Number(b), 0);
    const json = JSON.stringify(merged);

    if (stage === 2) {
      await q`
        INSERT INTO scores (submission_email, judge, scores, total, comment)
        VALUES (${email}, ${judge.email}, ${json}::jsonb, ${total}, ${comment})
        ON CONFLICT (submission_email, judge) DO UPDATE
          SET scores = EXCLUDED.scores, total = EXCLUDED.total, comment = EXCLUDED.comment, updated_at = now()`;
    } else {
      await q`
        INSERT INTO scores (submission_email, judge, scores, total, stage3_comment)
        VALUES (${email}, ${judge.email}, ${json}::jsonb, ${total}, ${comment})
        ON CONFLICT (submission_email, judge) DO UPDATE
          SET scores = EXCLUDED.scores, total = EXCLUDED.total, stage3_comment = EXCLUDED.stage3_comment, updated_at = now()`;
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Saving score failed:", err);
    return Response.json({ error: "Couldn't save the score. Please try again." }, { status: 500 });
  }
}
