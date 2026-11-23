"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Criterion = { key: string; label: string };

export default function ScoreForm({
  email, stage, criteria, min, max, initial, initialComment, disabledNote,
}: {
  email: string;
  /** The judged stage (2 or 3) these criteria belong to */
  stage: 2 | 3;
  criteria: Criterion[];
  min: number;
  max: number;
  initial: Record<string, number> | null;
  initialComment: string;
  /** When set, the scores are greyed out with this note and can't be used */
  disabledNote?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(criteria.map((c) => [c.key, initial?.[c.key] ? String(initial[c.key]) : ""])),
  );
  const [comment, setComment] = useState(initialComment);
  const hadScores = criteria.every((c) => initial?.[c.key]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">(hadScores ? "saved" : "idle");
  const [error, setError] = useState("");
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const complete = criteria.every((c) => values[c.key]);
  const total = criteria.reduce((sum, c) => sum + (Number(values[c.key]) || 0), 0);
  const off = Boolean(disabledNote);

  function change(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setStatus("idle");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (off) return;
    setError("");
    setStatus("saving");
    const res = await fetch("/api/admin/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, stage, scores: Object.fromEntries(criteria.map((c) => [c.key, Number(values[c.key])])), comment }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Couldn't save.");
      setStatus("idle");
      return;
    }
    setStatus("saved");
    router.refresh();
  }

  const selects = (
    <div className="score-grid">
      {criteria.map((c) => (
        <label key={c.key} className="score-row">
          <span>{c.label}</span>
          <select required value={values[c.key]} onChange={(e) => change(c.key, e.target.value)} aria-label={`${c.label}, ${min} to ${max}`}>
            <option value="" disabled>–</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      ))}
    </div>
  );

  // Waiting for Stage 1: just the note and the greyed-out scores
  if (off) {
    return (
      <div className="score-form is-disabled">
        <div className="waiting-note">{disabledNote}</div>
        <fieldset className="plain-fieldset" disabled>{selects}</fieldset>
      </div>
    );
  }

  return (
    <form className="score-form" onSubmit={save}>
      {error && <div className="alert err">{error}</div>}
      {selects}
      <textarea rows={2} maxLength={1000}
        placeholder={stage === 3 ? "Comment (optional): how the demo went, standout moments, concerns" : "Comment (optional): strengths, concerns, standout features"}
        value={comment} onChange={(e) => { setComment(e.target.value); setStatus("idle"); }} />
      <div className="score-actions">
        <button className="btn" type="submit" disabled={!complete || status === "saving"}>
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved ✓" : hadScores ? "Update score" : "Save score"}
        </button>
        {criteria.length > 1 && (
          <span className="muted small">Your total: <strong>{complete ? total : "–"}</strong> / {criteria.length * max}</span>
        )}
      </div>
    </form>
  );
}
