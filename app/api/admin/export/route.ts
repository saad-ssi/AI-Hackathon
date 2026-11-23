import { architectName, isAdmin, judgedJudges, judgeName } from "@/lib/auth";
import { ensureSchema, sql, type Score, type Screening } from "@/lib/db";
import { filterReasonLabel, JUDGED } from "@/lib/judging";
import { computeResults, type Entry } from "@/lib/results";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v instanceof Date ? v.toISOString() : v == null ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\r\n");
}

const round = (v: number | null | undefined) => (v === null || v === undefined ? "" : Math.round(v * 100) / 100);

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
  } else if (type === "stage1") {
    // One row per entry: the AI Architect team's decision
    const raw = (await q`
      SELECT s.email, s.project_name, r.name AS participant, sc.*
      FROM submissions s
      JOIN registrations r ON r.email = s.email
      LEFT JOIN screenings sc ON sc.submission_email = s.email
      ORDER BY s.project_name`) as (Partial<Screening> & { email: string; project_name: string; participant: string })[];
    rows = raw.map((r) => ({
      project: r.project_name,
      participant: r.participant,
      participant_email: r.email,
      stage1: r.status ?? "pending",
      completeness: r.completeness ?? "",
      technical_execution: r.technical ?? "",
      filter_reasons: (r.reasons ?? []).map(filterReasonLabel).join("; "),
      note: r.note ?? "",
      saved_by: r.architect ? architectName(r.architect) : "",
      updated_at: r.updated_at ?? "",
    }));
  } else if (type === "scores") {
    // One row per judge per entry, with each Stage 2 and Stage 3 criterion as its own column (blank if not theirs)
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
      ...Object.fromEntries(JUDGED.map((c) => [`Stage ${c.stage}: ${c.label}`, r.scores?.[c.key] ?? ""])),
      stage2_comment: r.comment,
      stage3_comment: r.stage3_comment ?? "",
      updated_at: r.updated_at,
    }));
  } else if (type === "results") {
    // One row per entry, in results order: Stage 1 scores, Stage 2 and 3 averages and the final score out of 50
    const subs = (await q`
      SELECT s.*, r.name, r.department FROM submissions s
      JOIN registrations r ON r.email = s.email`) as Entry[];
    const screenings = (await q`SELECT * FROM screenings`) as Screening[];
    const scores = (await q`SELECT * FROM scores`) as Score[];
    rows = computeResults(subs, screenings, scores, judgedJudges()).map((r) => ({
      rank: r.rank ?? "",
      tied: r.tied ? "yes" : "",
      project: r.s.project_name,
      participant: r.s.name,
      participant_email: r.s.email,
      stage1: r.stage,
      completeness: r.screening?.completeness ?? "",
      technical_execution: r.screening?.technical ?? "",
      ...Object.fromEntries(
        JUDGED.flatMap((c) => [[`Stage ${c.stage}: ${c.label} (avg)`, round(r.judged[c.key].avg)], [`Stage ${c.stage}: ${c.label} (judges)`, r.judged[c.key].count]]),
      ),
      final_out_of_50: round(r.total),
      complete: r.stage === "passed" ? (r.complete ? "yes" : "no") : "",
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
