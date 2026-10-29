import { EVENT } from "@/lib/config";

// Plain SSI frame for the admin and judging pages: no links back to the participant site.
export default function StaffShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <div className="brand">
            <span className="brand-mark">SSI</span>
            <span>{EVENT.name}</span>
            <span className="staff-label">{label}</span>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="wrap">
          <span>{EVENT.org}</span>
          <span>{EVENT.name}</span>
        </div>
      </footer>
    </>
  );
}
