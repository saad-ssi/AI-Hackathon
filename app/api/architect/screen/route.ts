import { getArchitect } from "@/lib/auth";
import { SCORE_MAX, SCORE_MIN } from "@/lib/config";
import { ensureSchema, sql } from "@/lib/db";
import { FILTER_REASONS } from "@/lib/judging";
import { clean, normalizeEmail } from "@/lib/validate";

const score = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= SCORE_MIN && n <= SCORE_MAX ? n : null;
};

// Saves the AI Architect team's Stage 1 decision for one entry. There's one decision per entry for the whole
// team: any architect can change it, and the last save wins (we record who saved it).
//   { email, status: "passed", completeness, technical, note? }
//   { email, status: "filtered", reasons: [...], note }   (the note is the short description of why)
//   { email, status: "pending" }                           (clears the decision)
export async function POST(req: Request) {
  const architect = await getArchitect();
  if (!architect) return Response.json({ error: "Please sign in as an architect." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const status = body.status;
  const note = clean(body.note, 1000);

  try {
    await ensureSchema();
    const q = sql();
    const exists = (await q`SELECT email FROM submissions WHERE email = ${email}`) as { email: string }[];
    if (exists.length === 0) return Response.json({ error: "That submission no longer exists." }, { status: 404 });

    if (status === "pending") {
      await q`DELETE FROM screenings WHERE submission_email = ${email}`;
      return Response.json({ ok: true });
    }

    if (status === "passed") {
      const completeness = score(body.completeness);
      const technical = score(body.technical);
      if (completeness === null || technical === null) {
        return Response.json({ error: `Please score Completeness and Technical execution from ${SCORE_MIN} to ${SCORE_MAX}.` }, { status: 400 });
      }
      await q`
        INSERT INTO screenings (submission_email, status, reasons, note, completeness, technical, architect)
        VALUES (${email}, 'passed', '[]'::jsonb, ${note}, ${completeness}, ${technical}, ${architect.email})
        ON CONFLICT (submission_email) DO UPDATE
          SET status = 'passed', reasons = '[]'::jsonb, note = EXCLUDED.note, completeness = EXCLUDED.completeness,
              technical = EXCLUDED.technical, architect = EXCLUDED.architect, updated_at = now()`;
      return Response.json({ ok: true });
    }

    if (status === "filtered") {
      const valid = new Set(FILTER_REASONS.map((r) => r.key));
      const given: string[] = Array.isArray(body.reasons) ? body.reasons.map(String) : [];
      const reasons = [...new Set(given)].filter((r) => valid.has(r));
      if (note.length < 3)return Response.json({ error: "Please add a short description of why it's filtered out." }, { status: 400 });
      await q`
        INSERT INTO screenings (submission_email, status, reasons, note, completeness, technical, architect)
        VALUES (${email}, 'filtered', ${JSON.stringify(reasons)}::jsonb, ${note}, NULL, NULL, ${architect.email})
        ON CONFLICT (submission_email) DO UPDATE
          SET status = 'filtered', reasons = EXCLUDED.reasons, note = EXCLUDED.note, completeness = NULL,
              technical = NULL, architect = EXCLUDED.architect, updated_at = now()`;
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Please choose Pass or Filter out." }, { status: 400 });
  } catch (err) {
    console.error("Saving Stage 1 failed:", err);
    return Response.json({ error: "Couldn't save. Please try again." }, { status: 500 });
  }
}
