"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Group = { key: string; label: string; reasons: { key: string; label: string }[] };
type Initial = { status: "passed" | "filtered"; reasons: string[]; note: string; completeness: number | null; technical: number | null } | null;

// Stage 1 decision for one entry: Pass (with the team's Completeness and Technical scores) or Filter out (with reasons)
export default function ScreenForm({
  email, groups, min, max, initial,
}: {
  email: string;
  groups: Group[];
  min: number;
  max: number;
  initial: Initial;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<"" | "passed" | "filtered">(initial?.status ?? "");
  const [completeness, setCompleteness] = useState(initial?.completeness ? String(initial.completeness) : "");
  const [technical, setTechnical] = useState(initial?.technical ? String(initial.technical) : "");
  const [reasons, setReasons] = useState<string[]>(initial?.reasons ?? []);
  const [note, setNote] = useState(initial?.note ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">(initial ? "saved" : "idle");
  const [error, setError] = useState("");
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const ready = decision === "passed" ? Boolean(completeness && technical) : decision === "filtered" ? note.trim().length >= 3 : false;

  function touch() {
    setStatus("idle");
    setError("");
  }

  async function send(payload: object) {
    setError("");
    setStatus("saving");
    const res = await fetch("/api/architect/screen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Couldn't save.");
      setStatus("idle");
      return false;
    }
    setStatus("saved");
    router.refresh();
    return true;
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    send(decision === "passed"
      ? { status: "passed", completeness: Number(completeness), technical: Number(technical), note }
      : { status: "filtered", reasons, note });
  }

  async function reset() {
    if (!confirm("Clear the Stage 1 decision for this entry? It goes back to pending.")) return;
    if (await send({ status: "pending" })) {
      setDecision("");
      setCompleteness("");
      setTechnical("");
      setReasons([]);
      setNote("");
      setStatus("idle");
    }
  }

  return (
    <form className="score-form" onSubmit={save}>
      {error && <div className="alert err">{error}</div>}
      <div className="decision-row" role="radiogroup" aria-label="Stage 1 decision">
        <label className={`decision pass ${decision === "passed" ? "on" : ""}`}>
          <input type="radio" name={`decision-${email}`} checked={decision === "passed"} onChange={() => { setDecision("passed"); touch(); }} />
          Pass to Stage 2
        </label>
        <label className={`decision filter ${decision === "filtered" ? "on" : ""}`}>
          <input type="radio" name={`decision-${email}`} checked={decision === "filtered"} onChange={() => { setDecision("filtered"); touch(); }} />
          Filter out
        </label>
      </div>

      {decision === "passed" && (
        <>
          <div className="score-grid">
            {[
              { key: "completeness", label: "Completeness", value: completeness, set: setCompleteness },
              { key: "technical", label: "Technical execution", value: technical, set: setTechnical },
            ].map((c) => (
              <label key={c.key} className="score-row">
                <span>{c.label}</span>
                <select required value={c.value} onChange={(e) => { c.set(e.target.value); touch(); }}>
                  <option value="" disabled>–</option>
                  {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            ))}
          </div>
          <textarea rows={2} maxLength={1000} placeholder="Note for the architects (optional)"
            value={note} onChange={(e) => { setNote(e.target.value); touch(); }} />
        </>
      )}

      {decision === "filtered" && (
        <>
          <div className="reason-groups">
            {groups.map((g) => (
              <fieldset key={g.key} className="reason-group">
                <legend>{g.label}</legend>
                {g.reasons.map((r) => (
                  <label key={r.key} className="check">
                    <input type="checkbox" checked={reasons.includes(r.key)}
                      onChange={(e) => { setReasons((prev) => (e.target.checked ? [...prev, r.key] : prev.filter((x) => x !== r.key))); touch(); }} />
                    <span>{r.label}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          <textarea rows={2} maxLength={1000} required placeholder="Why it's filtered out (required). Only architects and admins see this."
            value={note} onChange={(e) => { setNote(e.target.value); touch(); }} />
        </>
      )}

      <div className="score-actions">
        <button className="btn" type="submit" disabled={!ready || status === "saving"}>
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved ✓" : initial ? "Update decision" : "Save decision"}
        </button>
        {initial && (
          <button className="btn dark" type="button" disabled={status === "saving"} onClick={reset}>Reset to pending</button>
        )}
        {decision === "passed" && completeness && technical && (
          <span className="muted small">Stage 1 total: <strong>{Number(completeness) + Number(technical)}</strong> / {max * 2}</span>
        )}
      </div>
    </form>
  );
}
