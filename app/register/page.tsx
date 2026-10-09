import Link from "next/link";
import KeyDates from "@/components/KeyDates";
import RegisterForm from "@/components/RegisterForm";
import { allowedDomains, MUST_HAVES, registrationOpen } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Register | AI Hackathon 2026" };

export default function Register() {
  const open = registrationOpen();
  return (
    <section className="section">
      <div className="wrap">
        <h1>Register</h1>
        <p className="lead">Sign up with your company email. You&apos;ll use the same email to submit your entry.</p>
        <div style={{ margin: "24px 0 32px" }}>
          <KeyDates />
        </div>

        <div className="form-layout">
          {open ? (
            <RegisterForm domain={allowedDomains()[0] ?? ""} />
          ) : (
            <div className="closed">
              <h3>Registration is closed</h3>
              <p>Already registered? You can still <Link href="/submit">submit your entry</Link> until the deadline.</p>
            </div>
          )}

          <aside className="grid">
            <div className="card">
              <h3>Before you register</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Entries are individual: one person, one product.</li>
                <li>Read the <Link href="/use-cases">use cases</Link> and <Link href="/rules">rules &amp; rubric</Link>.</li>
                <li>You&apos;ll get a personal LiteLLM API key from the organizers for model access.</li>
                <li>Set up GitHub and Vercel early with the <Link href="/guide">guide</Link>.</li>
              </ul>
            </div>
            <div className="card white">
              <h3>Every entry must</h3>
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {MUST_HAVES.map((m) => <li key={m.title}>{m.title}</li>)}
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
