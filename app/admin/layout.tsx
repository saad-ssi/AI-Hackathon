import Link from "next/link";
import { EVENT } from "@/lib/config";

// The admin and judging view keeps the plain SSI look.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="brand">
            <span className="brand-mark">SSI</span>
            <span>{EVENT.name}</span>
          </Link>
          <nav className="nav" aria-label="Main">
            <Link href="/use-cases">Use cases</Link>
            <Link href="/rules">Rules &amp; rubric</Link>
            <Link href="/guide">Guide</Link>
            <Link href="/register">Register</Link>
            <Link href="/submit" className="cta">Submit</Link>
          </nav>
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
