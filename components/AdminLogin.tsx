"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const password = new FormData(e.currentTarget).get("password");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError((await res.json().catch(() => ({}))).error || "Login failed.");
  }

  return (
    <form className="panel" onSubmit={onSubmit}>
      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="field">
        <label htmlFor="password">Admin password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Checking..." : "Log in"}</button>
    </form>
  );
}
