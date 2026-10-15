"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }
  return <button className="btn dark" onClick={logout}>Sign out</button>;
}

export default function AdminActions() {
  return (
    <div className="btn-row" style={{ marginTop: 0 }}>
      <a className="btn" href="/api/admin/export?type=submissions">Download submissions (CSV)</a>
      <a className="btn" href="/api/admin/export?type=registrations">Download registrations (CSV)</a>
      <a className="btn" href="/api/admin/export?type=scores">Download scores (CSV)</a>
      <a className="btn dark" href="/api/admin/export?type=versions">Download all submission versions (CSV)</a>
    </div>
  );
}
