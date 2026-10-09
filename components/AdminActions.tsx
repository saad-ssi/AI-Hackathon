"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminActions({ pendingBackup, backupOn }: { pendingBackup: number; backupOn: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function resync() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/resync", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? `Sent ${data.sent} row(s) to the Google Sheet${data.failed ? `, ${data.failed} failed` : ""}.` : data.error || "Re-sync failed.");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div>
      {msg && <div className="alert ok">{msg}</div>}
      <div className="btn-row" style={{ marginTop: 0 }}>
        <a className="btn" href="/api/admin/export?type=submissions">Download submissions (CSV)</a>
        <a className="btn" href="/api/admin/export?type=registrations">Download registrations (CSV)</a>
        <a className="btn dark" href="/api/admin/export?type=versions">Download all submission versions (CSV)</a>
        {backupOn && (
          <button className="btn dark" onClick={resync} disabled={busy || pendingBackup === 0}>
            {busy ? "Sending..." : `Re-send ${pendingBackup} to Google Sheet`}
          </button>
        )}
        <button className="btn dark" onClick={logout}>Log out</button>
      </div>
    </div>
  );
}
