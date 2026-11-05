"use client";

import Link from "next/link";
import { useState } from "react";

type Details = { name: string; email: string; department: string; confirm: boolean; website: string };

// Two steps: send the details (we email a 6-digit code), then enter the code to finish registering.
export default function RegisterForm({ domain }: { domain: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "code" | "verifying" | "done">("idle");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [details, setDetails] = useState<Details | null>(null);
  const [updated, setUpdated] = useState(false);
  const [emailed, setEmailed] = useState(false);

  async function post(payload: object) {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Registration failed.");
    return data;
  }

  async function requestCode(d: Details) {
    setError("");
    setNote("");
    setStatus("saving");
    try {
      const data = await post(d);
      setDetails(d);
      setNote(data.note || "");
      setStatus("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setStatus(details ? "code" : "idle");
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    requestCode({
      name: String(f.get("name") ?? ""),
      email: String(f.get("email") ?? ""),
      department: String(f.get("department") ?? ""),
      confirm: f.get("confirm") === "on",
      website: String(f.get("website") ?? ""),
    });
  }

  async function onVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!details) return;
    setError("");
    setStatus("verifying");
    try {
      const data = await post({ email: details.email, code: String(new FormData(e.currentTarget).get("code") ?? "") });
      setUpdated(Boolean(data.updated));
      setEmailed(Boolean(data.emailed));
      setStatus("done");
      dispatchEvent(new CustomEvent("arcade:levelup", { detail: data.updated ? "REGISTRATION UPDATED. STILL IN THE GAME!" : "LEVEL UP! YOU'RE REGISTERED." }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setStatus("code");
    }
  }

  if (status === "done") {
    return (
      <div style={{ border: "1px solid var(--line)", padding: 24, borderRadius: 4 }}>
        <div className="alert ok">
          <strong>{updated ? "Your registration was updated." : "You're registered!"}</strong>
          {emailed && <> We&apos;ve emailed you a confirmation.</>}
        </div>
        <p>Next steps:</p>
        <ol>
          <li>Watch your inbox: the organizers will send you your personal LiteLLM API key and the kickoff details.</li>
          <li>Set up GitHub and Vercel ahead of time with the <Link href="/guide">guide</Link>.</li>
          <li>When your app is live, <Link href="/submit">submit it here</Link> using the same email.</li>
        </ol>
      </div>
    );
  }

  if ((status === "code" || status === "verifying") && details) {
    return (
      <form key="code-step" className="panel" onSubmit={onVerify}>
        {error && <div className="alert err" role="alert">{error}</div>}
        <div className="alert ok">
          We&apos;ve emailed a 6-digit code to <strong>{details.email}</strong>. {note || "Check your inbox (and junk folder)."}
        </div>
        <div className="field">
          <label htmlFor="code">Your code</label>
          <input
            id="code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" required
            pattern="\s*\d{6}\s*" maxLength={8} placeholder="123456" autoFocus
          />
          <div className="hint">The code expires in 15 minutes. You&apos;re registered once it&apos;s confirmed.</div>
        </div>
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button className="btn" type="submit" disabled={status === "verifying"}>
            {status === "verifying" ? "Checking..." : "Confirm and register"}
          </button>
          <button className="btn dark" type="button" disabled={status === "verifying"} onClick={() => requestCode(details)}>
            Send a new code
          </button>
          <button
            className="btn dark" type="button" disabled={status === "verifying"}
            onClick={() => { setStatus("idle"); setError(""); setNote(""); }}
          >
            Change details
          </button>
        </div>
      </form>
    );
  }

  return (
    <form key="details-step" className="panel" onSubmit={onSubmit} noValidate={false}>
      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="field">
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" type="text" required minLength={2} maxLength={100} autoComplete="name" defaultValue={details?.name} />
      </div>
      <div className="field">
        <label htmlFor="email">Company email</label>
        <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" placeholder={domain ? `you@${domain}` : ""} defaultValue={details?.email} />
        {domain && <div className="hint">Only @{domain} addresses are accepted. We&apos;ll email you a code to confirm it.</div>}
      </div>
      <div className="field">
        <label htmlFor="department">Department</label>
        <input id="department" name="department" type="text" required minLength={2} maxLength={100} placeholder="e.g. Engineering, QA, Finance" defaultValue={details?.department} />
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="check">
        <input type="checkbox" name="confirm" required defaultChecked={details?.confirm} />
        <span>I confirm I&apos;ll take part as an individual and follow the <Link href="/rules">rules</Link>, using only public or made-up data.</span>
      </label>
      <div className="btn-row" style={{ marginTop: 8 }}>
        <button className="btn" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Sending code..." : "Register"}
        </button>
      </div>
    </form>
  );
}
