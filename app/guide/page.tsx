import { readFile } from "fs/promises";
import path from "path";
import { marked } from "marked";
import GuideEnhancer from "@/components/GuideEnhancer";

export const metadata = { title: "Vercel guide | AI Hackathon 2026" };

// The guide's words live in content/quickstart.md; this page only arranges them into parts.
type Part = { id: string; title: string; subtitle: string; match: string[]; folded: string[] };

const PARTS: Part[] = [
  {
    id: "part-1",
    title: "Part 1: Get set up",
    subtitle: "How it works, what you need, and your tools",
    match: ["How it fits together", "Words you'll see", "Before you start", "Step 1", "Step 2"],
    folded: ["Words you'll see"],
  },
  {
    id: "part-2",
    title: "Part 2: Build your first app",
    subtitle: "Create the app on your laptop and make your first LLM call",
    match: ["Step 3", "Step 4", "Step 5", "Building in Python instead"],
    folded: ["Building in Python instead"],
  },
  {
    id: "part-3",
    title: "Part 3: Go live and submit",
    subtitle: "Put your code on GitHub, deploy on Vercel and submit",
    match: ["Step 6", "Step 7", "Step 8", "Step 9"],
    folded: [],
  },
  {
    id: "reference",
    title: "Reference",
    subtitle: "Come back to these when you need them",
    match: ["Troubleshooting", "Rules for keys and data", "Appendix"],
    folded: ["Troubleshooting", "Appendix"],
  },
];

type Section = { title: string; slug: string; html: string; step?: string; label: string; folded: boolean };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// "> [!WARNING] ..." / "> [!TIP] ..." blockquotes become styled callout boxes
function callouts(html: string) {
  return html.replace(/<blockquote>\s*<p>\[!(WARNING|TIP)\]\s*/g, (_m, kind: string) =>
    `<blockquote class="callout ${kind === "WARNING" ? "warn" : "tip"}"><p>`,
  );
}

async function render(md: string) {
  return callouts(await marked.parse(md, { gfm: true }));
}

export default async function Guide() {
  const md = await readFile(path.join(process.cwd(), "content", "quickstart.md"), "utf8");
  const [introMd, ...chunks] = md.split(/^## /m);
  const title = (introMd.match(/^# (.+)$/m)?.[1] ?? "Vercel Quickstart").trim();
  const introHtml = await render(introMd.replace(/^# .+$/m, ""));

  const sections: Section[] = await Promise.all(
    chunks.map(async (chunk) => {
      const nl = chunk.indexOf("\n");
      const heading = chunk.slice(0, nl).trim();
      const step = heading.match(/^Step (\d+):\s*(.+)$/);
      const part = PARTS.find((p) => p.match.some((m) => heading.startsWith(m)));
      return {
        title: step ? step[2] : heading,
        slug: slugify(heading),
        html: await render(chunk.slice(nl + 1)),
        step: step?.[1],
        label: step ? `Step ${step[1]}: ${step[2]}` : heading,
        folded: Boolean(part?.folded.some((m) => heading.startsWith(m))),
      };
    }),
  );
  const byPart = PARTS.map((p) => ({
    ...p,
    sections: sections.filter((s) => p.match.some((m) => s.label.startsWith(m))),
  }));

  const nav = (
    <nav aria-label="Guide contents">
      {byPart.map((p) => (
        <div key={p.id} className="toc-part">
          <a href={`#${p.id}`} className="toc-part-title">{p.title}</a>
          <ul>
            {p.sections.map((s) => (
              <li key={s.slug}><a href={`#${s.slug}`} data-toc={s.slug}>{s.label}</a></li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <section className="section guide">
      <div className="wrap">
        <header className="guide-head">
          <h1>{title}</h1>
          <div className="prose" dangerouslySetInnerHTML={{ __html: introHtml }} />
          <div className="grid cols-3 part-cards">
            {byPart.slice(0, 3).map((p, i) => (
              <a key={p.id} href={`#${p.id}`} className={`tile ${i % 2 ? "dark" : "red"} part-card`}>
                <div className="small">Part {i + 1}</div>
                <div className="big">{p.title.replace(/^Part \d: /, "")}</div>
                <div className="small">{p.subtitle}</div>
              </a>
            ))}
          </div>
        </header>

        <details className="toc-mobile">
          <summary>Contents</summary>
          {nav}
        </details>

        <div className="guide-layout">
          <aside className="toc">{nav}</aside>
          <div className="guide-body">
            {byPart.map((p) => (
              <div key={p.id} id={p.id} className="guide-part">
                <div className="part-head">
                  <h2>{p.title}</h2>
                  <p className="muted">{p.subtitle}</p>
                </div>
                {p.sections.map((s) =>
                  s.folded ? (
                    <details key={s.slug} id={s.slug} className="fold" data-section={s.slug}>
                      <summary>
                        <span className="fold-title">{s.title}</span>
                        <span className="fold-hint">Show</span>
                      </summary>
                      <div className="prose" dangerouslySetInnerHTML={{ __html: s.html }} />
                    </details>
                  ) : (
                    <article key={s.slug} id={s.slug} className={s.step ? "step-card" : "plain-card"} data-section={s.slug}>
                      <h3 className="step-title">
                        {s.step && <span className="badge">{s.step}</span>}
                        <span>{s.title}</span>
                      </h3>
                      <div className="prose" dangerouslySetInnerHTML={{ __html: s.html }} />
                    </article>
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <GuideEnhancer />
    </section>
  );
}
