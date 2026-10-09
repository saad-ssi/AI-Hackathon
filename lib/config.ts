// Everything participants read on the site lives here. Edit this file to change wording;
// dates come from environment variables so they can be changed on Vercel without a code change.

export const EVENT = {
  name: "AI Hackathon 2026",
  org: "Strategic Systems International",
  tagline: "Build with AI. Ship AI products.",
  objective:
    "Promote AI-driven development across SSI by building real AI-based products.",
  objectiveDetail:
    "Every participant uses AI to build, builds something AI-powered, and ships it live for leadership to see.",
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
  { big: "Individual", small: "One person, one product" },
  { big: EVENT.expectedParticipants, small: "Expected participants" },
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
  { title: "Submit", text: "Repo URL, live URL and a one-line pitch, here." },
  { title: "Judging", text: "Upper management scores each entry." },
  { title: "Winners", text: "Top 3 winners get the prizes." },
];

export const MUST_HAVES = [
  {
    title: "Make a real LLM call",
    text: "Through your LiteLLM key to score, summarise, classify or reason; not keyword rules.",
  },
  {
    title: "Use public or made-up data only",
    text: "Entries sit on public URLs, so no client or internal company data.",
  },
  {
    title: "Be live on Vercel",
    text: "A working public URL that judges can open and use.",
  },
  {
    title: "Meet a minimum bar, then stretch",
    text: "A working core first; stretch goals earn extra credit.",
  },
];

export type UseCase = {
  id: string;
  title: string;
  description: string;
  delivers?: string;
  sources?: string;
  agentic?: boolean;
};

export const USE_CASES: UseCase[] = [
  {
    id: "good-news-wire",
    title: "Good News Wire",
    description:
      "Pulls headlines from named public sources, uses an LLM to score and summarise each for positivity, and publishes a clean reading feed.",
  },
  {
    id: "conversational-bi",
    title: "Conversational BI Analyst",
    description:
      "Chat over a sample business dataset: ask questions in plain English and get answers backed by charts.",
  },
  {
    id: "akinator",
    title: "Akinator Simulator",
    description:
      "The AI plays 20 questions, asking targeted follow-ups to narrow down what you're thinking of, then reveals its guess.",
  },
  {
    id: "reimbursement",
    title: "Medical & Gym Reimbursement",
    description:
      "Upload receipts; AI extracts and validates details, fills the claim form and flags anything unusual. Replaces a manual SSI process.",
  },
  {
    id: "debate-partner",
    title: "Skeptical Debate Partner",
    description:
      "Two AI personas argue for and against any claim live, and you can jump in to challenge either side.",
  },
  {
    id: "adventure",
    title: "Choose-Your-Own-Adventure",
    description:
      "Describe a genre and get a branching story generated live, with new choices and consequences as you go.",
  },
  {
    id: "fact-checker",
    title: "Fact-Checking Agent",
    agentic: true,
    description:
      "Paste any article or post. The agent splits it into individual factual claims, searches free public sources for each one, cross-checks the evidence and searches again whenever sources disagree.",
    delivers:
      "A verdict for every claim (supported, disputed or unverified) with the evidence linked.",
    sources: "Wikipedia, Wikidata, World Bank and other free public APIs",
  },
  {
    id: "prior-art-scout",
    title: "Prior-Art Scout",
    agentic: true,
    description:
      "Describe an invention or product idea. The agent searches patents and research papers, sharpens its search terms based on what it finds, and keeps going until the results stop improving.",
    delivers:
      "The closest existing patents and papers, ranked, with a plain-English note on how each overlaps the idea.",
    sources: "PatentsView (free API key), OpenAlex, arXiv",
  },
];

export const OWN_IDEA = {
  id: "own-idea",
  title: "Bring your own idea",
  description:
    "Have something better? Build it. Any AI-powered product is welcome if it meets the four must-haves, and it's judged on exactly the same rubric as the sample use cases.",
};

export const RUBRIC = [
  { criterion: "Working, live product", weight: 20 },
  { criterion: "Effective use of Claude/Cursor", weight: 20 },
  { criterion: "Business value of the proposed solution", weight: 20 },
  { criterion: "Quality and creativity of the solution approach", weight: 15 },
  { criterion: "Execution quality", weight: 15 },
  { criterion: "Presentation", weight: 10 },
];

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
      "Use them exactly as you do day to day",
      "Already licensed org-wide; nothing new to install",
      "Recommended: Accept Edits mode, not full auto",
    ],
  },
  {
    title: "Power",
    sub: "LiteLLM API key",
    items: [
      "Personal key issued to each participant",
      "Gives your app real model calls at runtime",
      "Store it in Vercel's settings, never in code",
    ],
  },
  {
    title: "Deploy",
    sub: "Vercel (Hobby, free)",
    items: [
      "Sign in with GitHub, import the repo, deploy",
      "Every push redeploys automatically",
      "Follow the Guide page step by step",
    ],
  },
];
