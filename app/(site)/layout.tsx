import Link from "next/link";
import Bot from "@/components/arcade/Bot";
import Effects from "@/components/arcade/Effects";
import { HudScore, HudToggles } from "@/components/arcade/Hud";
import { EVENT } from "@/lib/config";

// Public pages: the Agent-A-Thon retro arcade theme from the marketing team (dark only, by design).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="arcade">
      <header className="hud">
        <div className="wrap">
          <Link href="/" className="hud-brand" aria-label={`${EVENT.name} home`}>
            <Bot size={26} />
            <span>AGENT-A-THON</span>
          </Link>
          <HudScore />
          <nav aria-label="Main">
            <Link href="/use-cases">USE CASES</Link>
            <Link href="/rules">RULES</Link>
            <Link href="/guide">GUIDE</Link>
            <Link href="/register">REGISTER</Link>
          </nav>
          <HudToggles />
          <Link href="/submit" className="btn sm">▶ SUBMIT</Link>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="arcade-footer">
        <div className="wrap">
          <span>{EVENT.org.toUpperCase()} · {EVENT.name.toUpperCase()}</span>
          <span>
            ONE WEEKEND. ONE BUILDER. <span style={{ color: "var(--red)" }}>ONE LIVE AGENT.</span>
          </span>
        </div>
      </footer>
      <Effects />
    </div>
  );
}
