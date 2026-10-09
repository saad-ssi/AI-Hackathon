import Link from "next/link";
import KeyDates from "@/components/KeyDates";
import { AT_A_GLANCE, EVENT, registrationOpen, STEPS, submissionsOpen } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function Home() {
  const regOpen = registrationOpen();
  const subOpen = submissionsOpen();
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
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Key dates</h2>
          <KeyDates />
          <p className="muted small">Dates marked TBD will be announced. Judging takes place over the weeks after the deadline.</p>
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
              <p>Pick one of eight sample use cases, or bring your own idea. Every entry must make a real LLM call and be live on Vercel.</p>
              <p style={{ marginTop: 12 }}><Link href="/use-cases">See the use cases →</Link></p>
            </div>
            <div className="card white">
              <h3>How you&apos;re judged</h3>
              <p>{EVENT.judges} score each live entry against a six-part rubric. Working product, effective use of Claude/Cursor and business value carry the most weight.</p>
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
