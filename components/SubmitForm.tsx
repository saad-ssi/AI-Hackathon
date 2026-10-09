"use client";

import { useState } from "react";

type Option = { id: string; title: string };

export default function SubmitForm({ useCases }: { useCases: Option[] }) {
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");
  const [version, setVersion] = useState(1);
  const [pitchLen, setPitchLen] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("saving");
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: f.get("email"),
          projectName: f.get("projectName"),
          useCase: f.get("useCase"),
          repoUrl: f.get("repoUrl"),
          liveUrl: f.get("liveUrl"),
          pitch: f.get("pitch"),
          checklist: f.get("checklist") === "on",
          website: f.get("website"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setVersion(data.version ?? 1);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div style={{ border: "1px solid var(--line)", padding: 24, borderRadius: 4 }}>
        <div className="alert ok">
          <strong>{version > 1 ? `Resubmission received (version ${version}).` : "Submission received!"}</strong>
        </div>
        <p>Your latest submission is the one that will be judged. You can resubmit any time before the deadline.</p>
        <p>Keep your app live and working until winners are announced: judges open your live URL directly.</p>
        <button className="btn dark" onClick={() => setStatus("idle")}>Submit an update</button>
      </div>
    );
  }

  return (
    <form className="panel" onSubmit={onSubmit}>
      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="field">
        <label htmlFor="email">Registered email</label>
        <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" />
        <div className="hint">The same company email you registered with.</div>
      </div>
      <div className="field">
        <label htmlFor="projectName">Project name</label>
        <input id="projectName" name="projectName" type="text" required minLength={2} maxLength={100} />
      </div>
      <div className="field">
        <label htmlFor="useCase">Use case</label>
        <select id="useCase" name="useCase" required defaultValue="">
          <option value="" disabled>Choose one</option>
          {useCases.map((u) => <option key={u.id} value={u.id}>{u.title}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="repoUrl">GitHub repo URL</label>
        <input id="repoUrl" name="repoUrl" type="url" required placeholder="https://github.com/your-username/my-hack" />
      </div>
      <div className="field">
        <label htmlFor="liveUrl">Live Vercel URL</label>
        <input id="liveUrl" name="liveUrl" type="url" required placeholder="https://my-hack.vercel.app" />
        <div className="hint">The short address under Domains in your Vercel project.</div>
      </div>
      <div className="field">
        <label htmlFor="pitch">One-line pitch</label>
        <textarea id="pitch" name="pitch" required minLength={10} maxLength={200} rows={2}
          placeholder="What your app does, and for whom" onChange={(e) => setPitchLen(e.target.value.length)} />
        <div className="hint">{pitchLen}/200 characters</div>
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="check">
        <input type="checkbox" name="checklist" required />
        <span>My live URL works in a private window, my repo is public, and it contains no API keys.</span>
      </label>
      <div className="btn-row" style={{ marginTop: 8 }}>
        <button className="btn" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Submitting..." : "Submit entry"}
        </button>
      </div>
    </form>
  );
}
