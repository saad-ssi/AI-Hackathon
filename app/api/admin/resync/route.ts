import { isAdmin } from "@/lib/auth";
import { appendToSheet, backupConfigured, REGISTRATION_HEADERS, SUBMISSION_HEADERS } from "@/lib/backup";
import { ensureSchema, sql, type Registration, type SubmissionVersion } from "@/lib/db";
import { useCaseTitle } from "@/lib/validate";

// Re-sends anything the Google Sheet did not confirm, oldest first.
export async function POST() {
  if (!(await isAdmin())) return Response.json({ error: "Not authorized" }, { status: 401 });
  if (!backupConfigured()) {
    return Response.json({ error: "Backup is not configured (BACKUP_WEBHOOK_URL / BACKUP_SECRET)." }, { status: 400 });
  }

  await ensureSchema();
  const q = sql();
  let sent = 0;
  let failed = 0;

  const regs = (await q`SELECT * FROM registrations WHERE backup_ok = false ORDER BY created_at`) as Registration[];
  for (const r of regs) {
    const ok = await appendToSheet("Registrations", REGISTRATION_HEADERS, [
      new Date().toISOString(),
      "resynced",
      r.email,
      r.name,
      r.department,
      new Date(r.created_at).toISOString(),
    ]);
    if (ok) {
      await q`UPDATE registrations SET backup_ok = true WHERE email = ${r.email}`;
      sent++;
    } else failed++;
  }

  const vers = (await q`SELECT * FROM submission_versions WHERE backup_ok = false ORDER BY id`) as SubmissionVersion[];
  for (const v of vers) {
    const ok = await appendToSheet("Submissions", SUBMISSION_HEADERS, [
      new Date(v.created_at).toISOString(),
      "resynced",
      v.email,
      v.version,
      v.project_name,
      useCaseTitle(v.use_case),
      v.repo_url,
      v.live_url,
      v.pitch,
    ]);
    if (ok) {
      await q`UPDATE submission_versions SET backup_ok = true WHERE id = ${v.id}`;
      sent++;
    } else failed++;
  }

  return Response.json({ ok: true, sent, failed });
}
