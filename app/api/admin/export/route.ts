import { isAdmin, judgeName } from "@/lib/auth";
import { CRITERIA } from "@/lib/config";
import { ensureSchema, sql } from "@/lib/db";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v instanceof Date ? v.toISOString() : v == null ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\r\n");
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Not authorized", { status: 401 });

  const type = new URL(req.url).searchParams.get("type");
  await ensureSchema();
  const q = sql();

  let rows: Record<string, unknown>[];
  if (type === "registrations") {
    rows = (await q`SELECT * FROM registrations ORDER BY created_at`) as Record<string, unknown>[];
  } else if (type === "submissions") {
    rows = (await q`
      SELECT s.*, r.name, r.department FROM submissions s
      JOIN registrations r ON r.email = s.email ORDER BY s.submitted_at`) as Record<string, unknown>[];
  } else if (type === "versions") {
    rows = (await q`SELECT * FROM submission_versions ORDER BY id`) as Record<string, unknown>[];
  } else if (type === "scores") {
    // One row per judge per entry, with each criterion as its own column
    const raw = (await q`
      SELECT sc.*, s.project_name, r.name AS participant FROM scores sc
      JOIN submissions s ON s.email = sc.submission_email
      JOIN registrations r ON r.email = sc.submission_email
      ORDER BY s.project_name, sc.judge`) as (Record<string, unknown> & { scores: Record<string, number> })[];
    rows = raw.map((r) => ({
      project: r.project_name,
      participant: r.participant,
      participant_email: r.submission_email,
      judge: judgeName(String(r.judge)),
      judge_email: r.judge,
      ...Object.fromEntries(CRITERIA.map((c) => [c.label, r.scores?.[c.key] ?? ""])),
      total: r.total,
      comment: r.comment,
      updated_at: r.updated_at,
    }));
  } else {
    return new Response("Unknown export type", { status: 400 });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  // BOM so Excel opens UTF-8 correctly
  return new Response("﻿" + toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hackathon-${type}-${stamp}.csv"`,
    },
  });
}
