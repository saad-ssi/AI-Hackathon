import AdminActions from "@/components/AdminActions";
import AdminLogin from "@/components/AdminLogin";
import { isAdmin } from "@/lib/auth";
import { backupConfigured } from "@/lib/backup";
import { ensureSchema, sql, type Registration, type Submission } from "@/lib/db";
import { useCaseTitle } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | AI Hackathon 2026", robots: { index: false } };

type SubRow = Submission & { name: string; department: string; backup_ok: boolean };

function fmt(ts: string) {
  return new Date(ts).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export default async function Admin() {
  if (!(await isAdmin())) {
    return (
      <section className="section">
        <div className="wrap" style={{ maxWidth: 480 }}>
          <h1>Admin</h1>
          {process.env.ADMIN_PASSWORD ? (
            <AdminLogin />
          ) : (
            <div className="alert err">ADMIN_PASSWORD is not set. Add it in Vercel&apos;s Environment Variables and redeploy.</div>
          )}
        </div>
      </section>
    );
  }

  let regs: Registration[] = [];
  let subs: SubRow[] = [];
  let pendingBackup = 0;
  let dbError = "";
  try {
    await ensureSchema();
    const q = sql();
    regs = (await q`SELECT * FROM registrations ORDER BY created_at DESC`) as Registration[];
    subs = (await q`
      SELECT s.*, r.name, r.department,
        NOT EXISTS (SELECT 1 FROM submission_versions v WHERE v.email = s.email AND v.backup_ok = false) AS backup_ok
      FROM submissions s JOIN registrations r ON r.email = s.email
      ORDER BY s.updated_at DESC`) as SubRow[];
    const p = (await q`
      SELECT (SELECT count(*) FROM registrations WHERE backup_ok = false)
           + (SELECT count(*) FROM submission_versions WHERE backup_ok = false) AS n`) as { n: string }[];
    pendingBackup = Number(p[0]?.n ?? 0);
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <section className="section">
      <div className="wrap">
        <h1>Admin</h1>
        {dbError && <div className="alert err">Database error: {dbError}</div>}

        <div className="grid cols-4" style={{ marginBottom: 24 }}>
          <div className="tile red"><div className="big">{regs.length}</div><div className="small">Registrations</div></div>
          <div className="tile dark"><div className="big">{subs.length}</div><div className="small">Submissions</div></div>
          <div className="tile red">
            <div className="big">{backupConfigured() ? pendingBackup : "Off"}</div>
            <div className="small">{backupConfigured() ? "Rows not yet in Google Sheet" : "Google Sheet backup not configured"}</div>
          </div>
        </div>

        <AdminActions pendingBackup={pendingBackup} backupOn={backupConfigured()} />

        <h2 style={{ marginTop: 40 }}>Submissions</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Project</th><th>Use case</th><th>Live URL</th><th>Repo</th><th>Pitch</th><th>Ver.</th><th>Updated</th><th>Backup</th></tr>
            </thead>
            <tbody>
              {subs.length === 0 && <tr><td colSpan={9} className="muted">No submissions yet.</td></tr>}
              {subs.map((s) => (
                <tr key={s.email}>
                  <td>{s.name}<br /><span className="muted">{s.email}</span></td>
                  <td>{s.project_name}</td>
                  <td>{useCaseTitle(s.use_case)}</td>
                  <td><a href={s.live_url} target="_blank" rel="noreferrer">{s.live_url.replace("https://", "")}</a></td>
                  <td><a href={s.repo_url} target="_blank" rel="noreferrer">GitHub</a></td>
                  <td>{s.pitch}</td>
                  <td>{s.version}</td>
                  <td>{fmt(s.updated_at)}</td>
                  <td>{s.backup_ok ? "✓" : "pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 style={{ marginTop: 40 }}>Registrations</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Department</th><th>Registered</th><th>Submitted</th><th>Backup</th></tr>
            </thead>
            <tbody>
              {regs.length === 0 && <tr><td colSpan={6} className="muted">No registrations yet.</td></tr>}
              {regs.map((r) => (
                <tr key={r.email}>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.department}</td>
                  <td>{fmt(r.created_at)}</td>
                  <td>{subs.some((s) => s.email === r.email) ? "Yes" : "No"}</td>
                  <td>{r.backup_ok ? "✓" : "pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
