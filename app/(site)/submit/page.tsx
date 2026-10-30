import Link from "next/link";
import Coin from "@/components/arcade/Coin";
import Rubric from "@/components/Rubric";
import SubmitForm from "@/components/SubmitForm";
import { formatDate, getDates, submissionsNotYetOpen, submissionsOpen } from "@/lib/config";
import { USE_CASE_OPTIONS } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submit | Agent-A-Thon 2026" };

export default function Submit() {
  const open = submissionsOpen();
  const notYet = submissionsNotYetOpen();
  const dates = getDates();
  const deadline = formatDate(dates.submissionsClose);
  return (
    <section className="section">
      <div className="wrap">
        <h1>Submit your entry</h1>
        <p className="lead">
          Deadline: <strong>{deadline}</strong>. You can resubmit as often as you like before the deadline; your latest submission is the one evaluated.
        </p>

        <div className="form-layout" style={{ marginTop: 32 }}>
          {open ? (
            <SubmitForm useCases={USE_CASE_OPTIONS} />
          ) : notYet ? (
            <div className="closed">
              <h3>Submissions open at kickoff</h3>
              <p>
                The submit form opens on <strong>{formatDate(dates.kickoff)}</strong>, when the build weekend starts, and closes on{" "}
                <strong>{deadline}</strong>. Until then, <Link href="/register">register</Link> and get set up with the{" "}
                <Link href="/guide">guide</Link>.
              </p>
            </div>
          ) : (
            <div className="closed">
              <h3>Submissions are closed</h3>
              <p>Thanks to everyone who took part. Evaluation is under way; keep your app live until winners are announced.</p>
            </div>
          )}

          <aside className="grid">
            <div className="card">
              <h3>Before you submit</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Use the short <code>.vercel.app</code> address from your project&apos;s <strong>Domains</strong>, not a long deployment link.</li>
                <li>Open your live URL in a private/incognito window and use the main feature end to end.</li>
                <li>Make sure your GitHub repo is public and contains no API keys (search it for <code>sk-</code>).</li>
                <li>Keep your app deployed and working until winners are announced.</li>
              </ul>
              <p style={{ marginTop: 12 }}>Stuck? See the <Link href="/guide">guide&apos;s troubleshooting table</Link>.</p>
            </div>
            <div className="card white">
              <h3>How it will be evaluated</h3>
              <Rubric />
            </div>
          </aside>
        </div>
      </div>
      <Coin id="submit" style={{ right: "2%", top: "45%" }} />
    </section>
  );
}
