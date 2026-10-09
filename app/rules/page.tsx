import Link from "next/link";
import Rubric from "@/components/Rubric";
import { EVENT, RULES, TOOLS } from "@/lib/config";

export const metadata = { title: "Rules & rubric | AI Hackathon 2026" };

export default function Rules() {
  return (
    <>
      <section className="section">
        <div className="wrap">
          <h1>Rules &amp; rubric</h1>
          <p className="lead">How entries are scored, the rules every participant follows, and the tools you&apos;ll use.</p>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="form-layout">
            <div>
              <h2>Scoring rubric</h2>
              <Rubric />
            </div>
            <div className="grid">
              <div className="card dark">
                <div className="tag" style={{ color: "#fff" }}>Judging panel</div>
                <h3>{EVENT.judges}</h3>
                <p>Judges open each live entry from the portal and score it against the rubric.</p>
              </div>
              <div className="card red">
                <div className="tag">Prizes</div>
                <p>{EVENT.prizes}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Rules &amp; guardrails</h2>
          <div className="grid cols-2">
            {RULES.map((r, i) => (
              <div className="card white" key={r.title}>
                <div className={`badge ${i % 2 ? "dark" : ""}`}>{i + 1}</div>
                <h3>{r.title}</h3>
                <p className="muted">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <h2>Tools &amp; platform</h2>
          <div className="grid cols-3">
            {TOOLS.map((t, i) => (
              <div className={`card ${i % 2 ? "dark" : "red"}`} key={t.title}>
                <h3 style={{ fontSize: 24, fontWeight: 300 }}>{t.title}</h3>
                <p style={{ fontWeight: 700, marginBottom: 12 }}>{t.sub}</p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {t.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 20 }}>
            New to Vercel? Follow the <Link href="/guide">step-by-step guide</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
