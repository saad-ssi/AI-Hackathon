import Link from "next/link";
import { MUST_HAVES, OWN_IDEA, USE_CASES } from "@/lib/config";

export const metadata = { title: "Use cases | AI Hackathon 2026" };

export default function UseCases() {
  return (
    <>
      <section className="section">
        <div className="wrap">
          <h1>What to build</h1>
          <p className="lead">
            Choose one of the sample use cases below, or bring your own idea. Every entry is judged on the same rubric.
          </p>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <h2>Every entry must</h2>
          <div className="grid cols-4">
            {MUST_HAVES.map((m, i) => (
              <div className="card white" key={m.title}>
                <div className="badge">{i + 1}</div>
                <h3>{m.title}</h3>
                <p className="muted">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Sample use cases</h2>
          <div className="grid cols-3">
            {USE_CASES.map((u, i) => (
              <div className="card" key={u.id}>
                <div className="badge">{i + 1}</div>
                <h3>
                  {u.title}
                  {u.agentic && <span className="pill">Agentic</span>}
                </h3>
                <p className="muted">{u.description}</p>
                {u.delivers && (
                  <>
                    <div className="tag">What it delivers</div>
                    <p>{u.delivers}</p>
                  </>
                )}
                {u.sources && (
                  <>
                    <div className="tag">Data sources</div>
                    <p className="muted small">{u.sources}</p>
                  </>
                )}
              </div>
            ))}
            <div className="card red">
              <div className="badge white">+</div>
              <h3>{OWN_IDEA.title}</h3>
              <p>{OWN_IDEA.description}</p>
            </div>
          </div>
          <div className="btn-row">
            <Link href="/register" className="btn">Register</Link>
            <Link href="/rules" className="btn dark">See the rubric</Link>
          </div>
        </div>
      </section>
    </>
  );
}
