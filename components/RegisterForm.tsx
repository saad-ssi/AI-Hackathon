"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterForm({ domain }: { domain: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("saving");
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          department: f.get("department"),
          confirm: f.get("confirm") === "on",
          website: f.get("website"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      setUpdated(Boolean(data.updated));
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div style={{ border: "1px solid var(--line)", padding: 24, borderRadius: 4 }}>
        <div className="alert ok">
          <strong>{updated ? "Your registration was updated." : "You're registered!"}</strong>
        </div>
        <p>Next steps:</p>
        <ol>
          <li>Watch your inbox for your LiteLLM API key and the kickoff details.</li>
          <li>Set up GitHub and Vercel ahead of time with the <Link href="/guide">guide</Link>.</li>
          <li>When your app is live, <Link href="/submit">submit it here</Link> using the same email.</li>
        </ol>
      </div>
    );
  }

  return (
    <form className="panel" onSubmit={onSubmit} noValidate={false}>
      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="field">
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" type="text" required minLength={2} maxLength={100} autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="email">Company email</label>
        <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" placeholder={domain ? `you@${domain}` : ""} />
        {domain && <div className="hint">Only @{domain} addresses are accepted.</div>}
      </div>
      <div className="field">
        <label htmlFor="department">Department</label>
        <input id="department" name="department" type="text" required minLength={2} maxLength={100} placeholder="e.g. Engineering, QA, Finance" />
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="check">
        <input type="checkbox" name="confirm" required />
        <span>I confirm I&apos;ll take part as an individual and follow the <Link href="/rules">rules</Link>, using only public or made-up data.</span>
      </label>
      <div className="btn-row" style={{ marginTop: 8 }}>
        <button className="btn" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Registering..." : "Register"}
        </button>
      </div>
    </form>
  );
}
