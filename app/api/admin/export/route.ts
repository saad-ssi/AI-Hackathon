import { isAdmin } from "@/lib/auth";
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
