import { getJudge } from "@/lib/auth";
import { CRITERIA, SCORE_MAX, SCORE_MIN } from "@/lib/config";
import { ensureSchema, sql } from "@/lib/db";
import { clean, normalizeEmail } from "@/lib/validate";

// Saves (or updates) the signed-in judge's scores for one submission.
export async function POST(req: Request) {
  const judge = await getJudge();
  if (!judge) return Response.json({ error: "Please sign in as a judge." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const comment = clean(body.comment, 1000);
  const scores: Record<string, number> = {};
  for (const c of CRITERIA) {
    const v = Number(body.scores?.[c.key]);
    if (!Number.isInteger(v) || v < SCORE_MIN || v > SCORE_MAX) {
      return Response.json({ error: `Please score every criterion from ${SCORE_MIN} to ${SCORE_MAX}.` }, { status: 400 });
    }
    scores[c.key] = v;
  }
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  try {
    await ensureSchema();
    const q = sql();
    const exists = (await q`SELECT email FROM submissions WHERE email = ${email}`) as { email: string }[];
    if (exists.length === 0) return Response.json({ error: "That submission no longer exists." }, { status: 404 });
    await q`
      INSERT INTO scores (submission_email, judge, scores, total, comment)
      VALUES (${email}, ${judge.email}, ${JSON.stringify(scores)}::jsonb, ${total}, ${comment})
      ON CONFLICT (submission_email, judge) DO UPDATE
        SET scores = EXCLUDED.scores, total = EXCLUDED.total, comment = EXCLUDED.comment, updated_at = now()`;
    return Response.json({ ok: true, total });
  } catch (err) {
    console.error("Saving score failed:", err);
    return Response.json({ error: "Couldn't save the score. Please try again." }, { status: 500 });
  }
}
