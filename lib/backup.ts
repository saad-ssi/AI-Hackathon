// Mirrors every registration and submission to a Google Sheet through a small Apps Script
// web app (see google-apps-script/Code.gs). The database stays the main copy; this is the backup.

export const REGISTRATION_HEADERS = [
  "Logged at (UTC)",
  "Event",
  "Email",
  "Name",
  "Department",
  "Registered at (UTC)",
];

export const SUBMISSION_HEADERS = [
  "Logged at (UTC)",
  "Event",
  "Email",
  "Version",
  "Project name",
  "Use case",
  "GitHub repo URL",
  "Live Vercel URL",
  "Pitch",
];

export function backupConfigured() {
  return Boolean(process.env.BACKUP_WEBHOOK_URL && process.env.BACKUP_SECRET);
}

/** Appends one row to the named sheet tab. Returns true only if the sheet confirmed the write. */
export async function appendToSheet(
  sheet: "Registrations" | "Submissions",
  headers: string[],
  row: (string | number)[],
): Promise<boolean> {
  const url = process.env.BACKUP_WEBHOOK_URL;
  const secret = process.env.BACKUP_SECRET;
  if (!url || !secret) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, sheet, headers, row }),
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    return data?.ok === true;
  } catch (err) {
    console.error("Backup to Google Sheet failed:", err);
    return false;
  }
}
