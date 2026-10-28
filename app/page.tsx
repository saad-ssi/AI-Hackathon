import Link from "next/link";
import KeyDates from "@/components/KeyDates";
import { AT_A_GLANCE, EVENT, formatDate, getDates, registrationNotYetOpen, registrationOpen, STEPS, submissionsOpen } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function Home() {
  const regOpen = registrationOpen();
  const dates = getDates();
  const regSoon = registrationNotYetOpen();
  // The submit button appears from kickoff; the page itself stays reachable
  const subOpen = submissionsOpen() && (!dates.kickoff || new Date() >= dates.kickoff);
  const anyTbd = Object.values(dates).some((d) => !d);
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="kicker">{EVENT.org}</div>
          <h1>{EVENT.name}</h1>
          <p className="lead">{EVENT.objective} {EVENT.objectiveDetail}</p>
          <div className="btn-row">
            {regOpen && <Link href="/register" className="btn">Register now</Link>}
            {subOpen && <Link href="/submit" className="btn secondary">Submit your entry</Link>}
            <Link href="/guide" className="btn secondary">Read the Vercel guide</Link>
          </div>
          {regSoon && <p className="hero-note">Registration opens {formatDate(dates.registrationOpens)}.</p>}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Key dates</h2>
          <KeyDates />
          <p className="muted small">All times are Pakistan time (PKT).{anyTbd && " Dates marked TBD will be announced."} Evaluation takes place over the weeks after the deadline.</p>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <h2>At a glance</h2>
          <div className="grid cols-3">
            {AT_A_GLANCE.map((f, i) => (
              <div key={f.big} className={`tile ${i % 2 === 0 ? "red" : "dark"}`}>
                <div className="big">{f.big}</div>
                <div className="small">{f.small}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>How it works</h2>
          <ol className="steps">
            {STEPS.map((s) => (
              <li key={s.title}>
                <strong>{s.title}</strong>
                <span className="muted small">{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="grid cols-3">
            <div className="card white">
              <h3>What to build</h3>
              <p>Bring your own idea, or start from one of three samples. Every entry must be an agentic AI solution, ideally a multi-agent workflow, running live on Vercel.</p>
              <p style={{ marginTop: 12 }}><Link href="/use-cases">See the use cases →</Link></p>
            </div>
            <div className="card white">
              <h3>How you&apos;re evaluated</h3>
              <p>{EVENT.judges} score each live entry on five criteria: completeness (including multi-agent orchestration), creativity & uniqueness, technical execution, presentation & live product, and business value.</p>
              <p style={{ marginTop: 12 }}><Link href="/rules">Rules &amp; rubric →</Link></p>
            </div>
            <div className="card red">
              <h3>Prizes</h3>
              <p>{EVENT.prizes}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
