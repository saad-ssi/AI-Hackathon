import { appendToSheet, SUBMISSION_HEADERS } from "@/lib/backup";
import { submissionsOpen } from "@/lib/config";
import { ensureSchema, sql, type SubmissionVersion } from "@/lib/db";
import {
  clean,
  liveUrlError,
  normalizeEmail,
  repoUrlError,
  USE_CASE_OPTIONS,
  useCaseTitle,
} from "@/lib/validate";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (clean(body.website)) return Response.json({ ok: true, version: 1 });

    if (!submissionsOpen()) {
      return Response.json({ error: "Submissions are closed." }, { status: 403 });
    }

    const email = normalizeEmail(body.email);
    const projectName = clean(body.projectName, 100);
    const useCase = clean(body.useCase, 50);
    const repoUrl = clean(body.repoUrl, 300).replace(/\/+$/, "");
    const liveUrl = clean(body.liveUrl, 300).replace(/\/+$/, "");
    const pitch = clean(body.pitch, 200);

    if (!email) return Response.json({ error: "Please enter the email you registered with." }, { status: 400 });
    if (projectName.length < 2) return Response.json({ error: "Please give your project a name." }, { status: 400 });
    if (!USE_CASE_OPTIONS.some((o) => o.id === useCase)) {
      return Response.json({ error: "Please choose a use case." }, { status: 400 });
    }
    const rErr = repoUrlError(repoUrl);
    if (rErr) return Response.json({ error: rErr }, { status: 400 });
    const lErr = liveUrlError(liveUrl);
    if (lErr) return Response.json({ error: lErr }, { status: 400 });
    if (pitch.length < 10) return Response.json({ error: "Please write a one-line pitch (at least 10 characters)." }, { status: 400 });
    if (body.checklist !== true) {
      return Response.json({ error: "Please confirm the final checks before submitting." }, { status: 400 });
    }

    await ensureSchema();
    const q = sql();
    const reg = (await q`SELECT email FROM registrations WHERE email = ${email}`) as { email: string }[];
    if (reg.length === 0) {
      return Response.json(
        { error: "We couldn't find a registration for this email. Please register first, using the same email." },
        { status: 404 },
      );
    }

    // Keep every version; the newest one is the current submission.
    const versions = (await q`
      INSERT INTO submission_versions (email, version, project_name, use_case, repo_url, live_url, pitch)
      SELECT ${email}, COALESCE(MAX(version), 0) + 1, ${projectName}, ${useCase}, ${repoUrl}, ${liveUrl}, ${pitch}
      FROM submission_versions WHERE email = ${email}
      RETURNING *`) as SubmissionVersion[];
    const v = versions[0];

    await q`
      INSERT INTO submissions (email, project_name, use_case, repo_url, live_url, pitch, version)
      VALUES (${email}, ${projectName}, ${useCase}, ${repoUrl}, ${liveUrl}, ${pitch}, ${v.version})
      ON CONFLICT (email) DO UPDATE SET
        project_name = EXCLUDED.project_name, use_case = EXCLUDED.use_case, repo_url = EXCLUDED.repo_url,
        live_url = EXCLUDED.live_url, pitch = EXCLUDED.pitch, version = EXCLUDED.version, updated_at = now()`;

    const backedUp = await appendToSheet("Submissions", SUBMISSION_HEADERS, [
      new Date(v.created_at).toISOString(),
      v.version === 1 ? "submitted" : "resubmitted",
      email,
      v.version,
      projectName,
      useCaseTitle(useCase),
      repoUrl,
      liveUrl,
      pitch,
    ]);
    if (backedUp) await q`UPDATE submission_versions SET backup_ok = true WHERE id = ${v.id}`;

    return Response.json({ ok: true, version: v.version });
  } catch (err) {
    console.error("Submission failed:", err);
    return Response.json({ error: "Something went wrong saving your submission. Please try again." }, { status: 500 });
  }
}
