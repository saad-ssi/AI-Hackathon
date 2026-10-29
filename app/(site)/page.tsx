import Link from "next/link";
import Coin from "@/components/arcade/Coin";
import Countdown from "@/components/arcade/Countdown";
import { AppleLogo, WithApple } from "@/components/arcade/Apple";
import Bot from "@/components/arcade/Bot";
import { HiScore } from "@/components/arcade/Hud";
import IPad from "@/components/arcade/IPad";
import LevelMap from "@/components/arcade/LevelMap";
import Logo from "@/components/arcade/Logo";
import KeyDates from "@/components/KeyDates";
import {
  AT_A_GLANCE, CRITERIA, EVENT, getDates, OWN_IDEA, registrationOpen, shortDate, STEPS, submissionsOpen, USE_CASES,
  WINNERS_SHORT,
} from "@/lib/config";

export const dynamic = "force-dynamic";

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export default function Home() {
  const dates = getDates();
  const regOpen = registrationOpen();
  // The submit button appears from kickoff; the page itself stays reachable
  const subOpen = submissionsOpen() && (!dates.kickoff || new Date() >= dates.kickoff);
  // Winners have no exact date yet: place the boss level about two weeks after the deadline
  const winnersAt = dates.winnersAnnounced ?? (dates.submissionsClose ? new Date(dates.submissionsClose.getTime() + 16 * 864e5) : null);

  const levels = [
    { tag: "LVL 1", name: "Registration opens", when: shortDate(dates.registrationOpens), at: iso(dates.registrationOpens), color: "#3DDC97" },
    { tag: "LVL 2", name: "Registration closes", when: shortDate(dates.registrationCloses, true), at: iso(dates.registrationCloses), color: "#FFD23F" },
    { tag: "LVL 3", name: "Kickoff", when: shortDate(dates.kickoff, true), at: iso(dates.kickoff), color: "#E5333D" },
    { tag: "LVL 4", name: "Submissions close", when: shortDate(dates.submissionsClose, true), at: iso(dates.submissionsClose), color: "#E5333D" },
    { tag: "BOSS", name: "Winners", when: dates.winnersAnnounced ? shortDate(dates.winnersAnnounced) : WINNERS_SHORT, at: iso(winnersAt), color: "#5AA9FF" },
  ];
  const milestones = [
    { at: iso(dates.registrationOpens), label: "REGISTRATION OPENS" },
    { at: iso(dates.registrationCloses), label: "REGISTRATION CLOSES" },
    { at: iso(dates.kickoff), label: "KICKOFF" },
    { at: iso(dates.submissionsClose), label: "SUBMISSIONS CLOSE" },
  ];
  // Short summaries here; each card opens the full description on the use cases page
  const quests = [
    { id: OWN_IDEA.id, tag: "▶ RECOMMENDED", name: OWN_IDEA.title, summary: OWN_IDEA.summary, team: OWN_IDEA.team },
    ...USE_CASES.map((u, i) => ({ id: u.id, tag: `QUEST 0${i + 1}`, name: u.title, summary: u.summary, team: u.team })),
  ];

  return (
    <>
      <section className="aat-hero">
        <div className="wrap">
          <div className="top">
            <span>{EVENT.org.toUpperCase()}</span>
            <HiScore />
          </div>
          <Logo />
          <p className="sub">
            Build and deploy a <b>live agentic AI app</b>, ideally a multi-agent workflow, in one weekend. Leadership scores it.{" "}
            <b style={{ color: "var(--yel)" }}><WithApple text={EVENT.prizes} /></b>
          </p>
          <div className="cta">
            {regOpen && <Link className="btn" href="/register">▶ INSERT COIN · REGISTER</Link>}
            {subOpen && <Link className="btn" href="/submit">▶ SUBMIT YOUR BUILD</Link>}
            <a className="btn ghost" href="#quests">PICK A QUEST</a>
            <Link className="btn ghost" href="/guide">READ THE GUIDE</Link>
          </div>
          <Countdown milestones={milestones} done="GAME OVER · WINNERS IN DECEMBER" />
        </div>
        <Coin id="hero" style={{ right: "8%", top: "38%" }} />
      </section>

      <section className="lvl" id="dates">
        <div className="wrap">
          <p className="eyebrow">LEVEL MAP · PAKISTAN TIME</p>
          <h2>KEY DATES</h2>
          <p className="lede">The bot marks where today sits on the road to the build weekend.</p>
          <LevelMap levels={levels} />
          <KeyDates />
          <p className="note">All times are Pakistan time (PKT). Evaluation takes place over the weeks after the deadline.</p>
        </div>
        <Coin id="dates" style={{ left: "3%", top: "18%" }} />
      </section>

      <section className="lvl" id="glance">
        <div className="wrap">
          <p className="eyebrow">THE GAME</p>
          <h2>AT A GLANCE</h2>
          <p className="lede">{EVENT.objective}</p>
          <div className="glance">
            {AT_A_GLANCE.map((f) => (
              <div className="gtile" key={f.big}>
                <b>{f.big.toUpperCase()}</b>
                <span>{f.small}.</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lvl" id="how">
        <div className="wrap">
          <p className="eyebrow">HOW TO PLAY</p>
          <h2>SEVEN STAGES</h2>
          <ol className="stages">
            {STEPS.map((s) => (
              <li key={s.title}>
                <b>{s.title.toUpperCase()}</b>
                <span><WithApple text={s.text} /></span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lvl" id="quests">
        <div className="wrap">
          <p className="eyebrow">CHARACTER SELECT</p>
          <h2>PICK YOUR QUEST</h2>
          <p className="lede">Every entry is an agentic AI solution, ideally multi-agent, running live on Vercel. Bring your own idea or start from a sample.</p>
          <div className="quests">
            {quests.map((q, i) => (
              <Link key={q.id} href={`/use-cases#${q.id}`} className={`quest${i === 0 ? " featured" : ""}`}>
                <span className="qtag">{q.tag}</span>
                <h3>{q.name}</h3>
                <p>{q.summary}</p>
                <span className="mini-team" aria-hidden="true">
                  {q.team.map((a, j) => <Bot key={j} color={a.color} size={22} />)}
                </span>
                <span className="more">READ MORE ▶</span>
              </Link>
            ))}
          </div>
          <div className="cta left">
            <Link className="btn ghost" href="/use-cases">ALL USE CASES ▶</Link>
          </div>
        </div>
        <Coin id="quests" style={{ right: "3%", bottom: "12%" }} />
      </section>

      <section className="lvl" id="rules-scoring">
        <div className="wrap">
          <p className="eyebrow">FAIR · SAFE · REAL</p>
          <h2>RULES &amp; SCORING</h2>
          <div className="duo">
            <div className="panel-card">
              <h3>HOW YOU&apos;RE SCORED</h3>
              <p>{EVENT.judges} open each live entry and score it on {CRITERIA.length} criteria, all counted equally:</p>
              <ul className="chips">
                {CRITERIA.map((c) => <li key={c.key}>{c.label.split(" (")[0]}</li>)}
              </ul>
              <Link className="btn sm" href="/rules">SEE THE RUBRIC ▶</Link>
            </div>
            <div className="panel-card">
              <h3>HOUSE RULES</h3>
              <p>
                Build on your own, with public or made-up data only. Keep your API key out of the code, use safe agent settings,
                and ship a working app live on Vercel before adding polish.
              </p>
              <Link className="btn sm" href="/rules">READ THE RULES ▶</Link>
            </div>
          </div>
        </div>
        <Coin id="rules" style={{ left: "2%", bottom: "8%" }} />
      </section>

      <section className="lvl" id="prize">
        <div className="wrap prize">
          <IPad />
          <div>
            <p className="eyebrow">THE PRIZE</p>
            <h2>
              HIGH SCORE
              <br />
              WINS AN{" "}
              <span>
                <AppleLogo />
                iPAD
              </span>
            </h2>
            <p className="prize-text"><WithApple text={EVENT.prizes} /> Register with your SSI email, build over one weekend, ship it live.</p>
            <div className="cta left">
              {regOpen && <Link className="btn" href="/register">▶ REGISTER NOW</Link>}
              <Link className="btn ghost" href="/submit">SUBMIT YOUR BUILD</Link>
            </div>
          </div>
        </div>
        <Coin id="prize" style={{ right: "6%", top: "14%" }} />
      </section>
    </>
  );
}
