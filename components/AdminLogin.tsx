"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Admins (/admin) and judges (/judge) each sign in with their own email plus their role's password
export default function AdminLogin({ role }: { role: "admin" | "judge" }) {
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
      body: JSON.stringify({ role, password: f.get("password"), email: f.get("email") }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError((await res.json().catch(() => ({}))).error || "Login failed.");
  }

  return (
    <form className="panel" onSubmit={onSubmit}>
      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="field">
        <label htmlFor="email">Your email</label>
        <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@ssidecisions.com" />
        <div className="hint">The email the organizers registered you with as {role === "admin" ? "an admin" : "a judge"}.</div>
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
        <div className="hint">{role === "admin" ? "The admin password." : "The judge password the organizers shared with you."}</div>
      </div>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Checking..." : "Sign in"}</button>
    </form>
  );
}
