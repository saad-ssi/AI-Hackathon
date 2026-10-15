"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogin({ judgesEnabled }: { judgesEnabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: f.get("password"), email: f.get("email") }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError((await res.json().catch(() => ({}))).error || "Login failed.");
  }

  return (
    <form className="panel" onSubmit={onSubmit}>
      {error && <div className="alert err" role="alert">{error}</div>}
      {judgesEnabled && (
        <div className="field">
          <label htmlFor="email">Your email <span className="muted small">(judges)</span></label>
          <input id="email" name="email" type="email" maxLength={200} autoComplete="email" placeholder="you@ssidecisions.com" />
          <div className="hint">Judges: use the email the organizers registered you with. Organizers can leave it empty.</div>
        </div>
      )}
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
        <div className="hint">{judgesEnabled ? "Use the judge password to score entries, or the admin password to manage the event." : "Admin password."}</div>
      </div>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Checking..." : "Sign in"}</button>
    </form>
  );
}
