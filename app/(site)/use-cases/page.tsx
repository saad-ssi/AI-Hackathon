import Link from "next/link";
import Coin from "@/components/arcade/Coin";
import { MUST_HAVES, OWN_IDEA, USE_CASES, USE_CASES_NOTE } from "@/lib/config";

export const metadata = { title: "Use cases | Agent-A-Thon 2026" };

export default function UseCases() {
  return (
    <>
      <section className="section">
        <div className="wrap">
          <h1>What to build</h1>
          <p className="lead">
            Build an agentic AI solution, ideally a multi-agent workflow. Bring your own idea, or start from one of the samples below. Every entry is evaluated on the same rubric.
          </p>
        </div>
        <Coin id="use-cases" style={{ right: "6%", top: "30%" }} />
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
          <h2>Your idea, or a sample</h2>
          <div className="grid cols-2">
            <div className="card red">
              <div className="badge white">+</div>
              <h3>{OWN_IDEA.title}</h3>
              <p>{OWN_IDEA.description}</p>
            </div>
            {USE_CASES.map((u, i) => (
              <div className="card" key={u.id}>
                <div className="badge">{i + 1}</div>
                <h3>{u.title}</h3>
                <p className="muted">{u.description}</p>
              </div>
            ))}
          </div>
          <div className="card white" style={{ marginTop: 24 }}>
            <h3>{USE_CASES_NOTE.title}</h3>
            <p>{USE_CASES_NOTE.text}</p>
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
