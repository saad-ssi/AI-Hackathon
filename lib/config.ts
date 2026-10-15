// Everything participants read on the site lives here. Edit this file to change wording;
// dates come from environment variables so they can be changed on Vercel without a code change.

export const EVENT = {
  name: "AI Hackathon 2026",
  org: "Strategic Systems International",
  tagline: "Build agentic AI. Ship it live.",
  objective:
    "Promote AI-driven development across SSI by building real agentic AI products.",
  objectiveDetail:
    "Every participant builds an agentic AI application, ideally a multi-agent workflow, and ships it live for leadership to evaluate.",
  prizes: "Top 3 winners receive prizes. Prize details: TBD.",
  judges: "Upper management",
  expectedParticipants: "~100",
};

function envDate(name: string): Date | null {
  const v = process.env[name]?.trim();
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function getDates() {
  return {
    registrationCloses: envDate("REGISTRATION_CLOSES"),
    kickoff: envDate("KICKOFF_AT"),
    submissionsClose: envDate("SUBMISSIONS_CLOSE"),
    winnersAnnounced: envDate("WINNERS_ANNOUNCED"),
  };
}

export function formatDate(d: Date | null): string {
  if (!d) return "TBD";
  const tz = process.env.EVENT_TIMEZONE?.trim() || "UTC";
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
      timeZoneName: "short",
    }).format(d);
  } catch {
    return d.toUTCString();
  }
}

export function registrationOpen(now = new Date()) {
  const { registrationCloses } = getDates();
  return !registrationCloses || now < registrationCloses;
}

export function submissionsOpen(now = new Date()) {
  const { submissionsClose } = getDates();
  return !submissionsClose || now < submissionsClose;
}

export function allowedDomains(): string[] {
  return (process.env.ALLOWED_EMAIL_DOMAINS || "ssidecisions.com")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export const AT_A_GLANCE = [
  { big: "Agentic AI", small: "Multi-agent workflows strongly encouraged" },
  { big: "Individual", small: "One person, one product" },
  { big: "1 weekend", small: "Friday kickoff to Sunday deadline" },
  { big: "Claude + Cursor", small: "Build tools, already licensed org-wide" },
  { big: "LiteLLM", small: "Personal API key for model access" },
  { big: "Vercel", small: "Free deployment with a live public URL" },
];

export const STEPS = [
  { title: "Register", text: "Sign up on this portal with your SSI email." },
  { title: "Kickoff", text: "Rules, rubric and use cases walked through." },
  { title: "Build", text: "Locally, with Cursor or Claude Code." },
  { title: "Deploy", text: "Push to GitHub, deploy on Vercel." },
  { title: "Submit", text: "Repo URL, live URL and a short project summary, here." },
  { title: "Evaluation", text: "Upper management scores each entry." },
  { title: "Winners", text: "Top 3 winners get the prizes." },
];

export const MUST_HAVES = [
  {
    title: "Build an agentic AI solution",
    text: "Your app uses AI agents that plan, call tools or APIs and act on the results, live through your LiteLLM key, not a single prompt. Multi-agent workflows (agents with distinct roles handing work to each other) are strongly encouraged and score higher.",
  },
  {
    title: "Use public or made-up data only",
    text: "Entries sit on public URLs, so no client or internal company data.",
  },
  {
    title: "Be live on Vercel",
    text: "A working public URL that evaluators can open and use. Build in JavaScript or Python (FastAPI/Flask); Streamlit and Gradio can't run on Vercel.",
  },
  {
    title: "Working core first, then stretch",
    text: "Get one agent flow working end to end, then add agents, tools and polish. Showing each agent's steps in your app helps evaluators score the orchestration.",
  },
];

export type UseCase = {
  id: string;
  title: string;
  description: string;
};

export const USE_CASES: UseCase[] = [
  {
    id: "fact-checker",
    title: "Fact-Checking Agents",
    description:
      "Paste any article. An extractor agent splits it into factual claims, researcher agents check each claim against free public sources (e.g. Wikipedia, World Bank data), and a verifier agent weighs the evidence, sends researchers back when sources disagree, and returns a verdict with links for every claim.",
  },
  {
    id: "prior-art-scout",
    title: "Prior-Art Scout",
    description:
      "Describe an invention or product idea. A search agent queries patents and research papers (PatentsView, OpenAlex, arXiv), an analyst agent ranks the closest matches and explains the overlap, and a critic agent challenges the ranking and sends the search back with sharper terms until the results stop improving.",
  },
  {
    id: "debate-partner",
    title: "Skeptical Debate Partner",
    description:
      "Pick any claim or decision. A 'for' agent and an 'against' agent each research and argue their side live, while a moderator agent keeps the debate on track, scores each round and writes the final summary. You can jump in to challenge either side.",
  },
];

export const USE_CASES_NOTE = {
  title: "These are starting points, not limits",
  text:
    "The samples are only examples: bring your own idea, or change, combine or extend them. Whatever you build, " +
    "the more real work your agents do (planning, using tools, checking each other's results), the stronger your Completeness score.",
};

export const OWN_IDEA = {
  id: "own-idea",
  title: "Bring your own idea",
  description:
    "The recommended path. Build any agentic AI product you believe in, ideally with several agents that have distinct roles. It must meet the four must-haves and is evaluated on exactly the same rubric as the samples.",
};

// Evaluation criteria, all counted equally. Keys are used to store judges' scores, so don't change them.
export const CRITERIA = [
  { key: "completeness", label: "Completeness (including multi-agent orchestration)" },
  { key: "creativity", label: "Creativity & uniqueness" },
  { key: "technical", label: "Technical execution" },
  { key: "presentation", label: "Presentation & live product" },
  { key: "business", label: "Business value of the proposed solution" },
] as const;

export const SCORE_MIN = 1;
export const SCORE_MAX = 10;

export const RULES = [
  {
    title: "Individual work",
    text: "One entry per person, built in your own repo and deployed from your own Vercel account.",
  },
  {
    title: "Public or made-up data only",
    text: "Entries are public URLs. Never use client, customer or internal company data.",
  },
  {
    title: "Protect your API key",
    text: "Store the LiteLLM key as a Vercel environment variable. Never commit it to the repo.",
  },
  {
    title: "Safe AI-agent settings",
    text: "Use Accept Edits mode, not full auto. These are everyday laptops with real company credentials nearby.",
  },
];

export const TOOLS = [
  {
    title: "Build",
    sub: "Cursor or Claude Code",
    items: [
      "Build in JavaScript (Next.js) or Python (FastAPI or Flask, e.g. with LangGraph)",
      "Agents can be plain code; LangGraph or the Vercel AI SDK are optional helpers",
      "Already licensed org-wide; nothing new to install",
    ],
  },
  {
    title: "Power",
    sub: "LiteLLM API key",
    items: [
      "Personal key issued to each participant",
      "Gives your agents real model calls at runtime",
      "Spend cap per key; usage tracked centrally",
    ],
  },
  {
    title: "Deploy",
    sub: "Vercel (Hobby, free)",
    items: [
      "Sign in with GitHub, import the repo, deploy",
      "Every push redeploys automatically",
      "Free Hobby plan with a live public URL",
      "Follow the Guide page step by step",
    ],
  },
];
