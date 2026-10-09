import { readFile } from "fs/promises";
import path from "path";
import { marked } from "marked";

export const metadata = { title: "Vercel guide | AI Hackathon 2026" };

export default async function Guide() {
  const md = await readFile(path.join(process.cwd(), "content", "quickstart.md"), "utf8");
  // The markdown is our own file in the repo, not user input, so rendering it as HTML is safe.
  const html = await marked.parse(md, { gfm: true });
  return (
    <section className="section">
      <div className="wrap">
        <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}
