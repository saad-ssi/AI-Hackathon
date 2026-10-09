"use client";

import { useRouter } from "next/navigation";

export default function AdminActions() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="btn-row" style={{ marginTop: 0 }}>
      <a className="btn" href="/api/admin/export?type=submissions">Download submissions (CSV)</a>
      <a className="btn" href="/api/admin/export?type=registrations">Download registrations (CSV)</a>
      <a className="btn dark" href="/api/admin/export?type=versions">Download all submission versions (CSV)</a>
      <button className="btn dark" onClick={logout}>Log out</button>
    </div>
  );
}
