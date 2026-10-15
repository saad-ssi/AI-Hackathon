"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Criterion = { key: string; label: string };

export default function ScoreForm({
  email, criteria, min, max, initial, initialComment,
}: {
  email: string;
  criteria: Criterion[];
  min: number;
  max: number;
  initial: Record<string, number> | null;
  initialComment: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(criteria.map((c) => [c.key, initial?.[c.key] ? String(initial[c.key]) : ""])),
  );
  const [comment, setComment] = useState(initialComment);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">(initial ? "saved" : "idle");
  const [error, setError] = useState("");
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const complete = criteria.every((c) => values[c.key]);
  const total = criteria.reduce((sum, c) => sum + (Number(values[c.key]) || 0), 0);

  function change(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setStatus("idle");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("saving");
    const res = await fetch("/api/admin/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, scores: Object.fromEntries(criteria.map((c) => [c.key, Number(values[c.key])])), comment }),
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

  return (
    <form className="score-form" onSubmit={save}>
      {error && <div className="alert err">{error}</div>}
      <div className="score-grid">
        {criteria.map((c) => (
          <label key={c.key} className="score-row">
            <span>{c.label}</span>
            <select required value={values[c.key]} onChange={(e) => change(c.key, e.target.value)}>
              <option value="" disabled>–</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        ))}
      </div>
      <textarea rows={2} maxLength={1000} placeholder="Comment (optional): strengths, concerns, standout features"
        value={comment} onChange={(e) => { setComment(e.target.value); setStatus("idle"); }} />
      <div className="score-actions">
        <button className="btn" type="submit" disabled={!complete || status === "saving"}>
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved ✓" : initial ? "Update score" : "Save score"}
        </button>
        <span className="muted small">Total: <strong>{complete ? total : "–"}</strong> / {criteria.length * max}</span>
      </div>
    </form>
  );
}
