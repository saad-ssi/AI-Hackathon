// How entries are judged (staff only; the participant pages keep using CRITERIA in lib/config.ts).
//
//   Stage 1, the AI Architect team (/architect): each entry is either filtered out, with a short reason only
//   architects and admins see, or passes with one team score for Completeness and one for Technical execution.
//   Stage 2, upper management (/judge): Creativity & uniqueness and Business value.
//   Stage 3, upper management (/judge/stage-3): Presentation & live product, which may be judged at a live demo.
//   In Stages 2 and 3 each judge scores only their assigned criteria, and only entries that passed Stage 1.
//   Each of those criteria's score is the average of its judges' scores.
//   Final score = the two Stage 1 scores + the three judged averages, out of 50.
//
// The criterion keys match CRITERIA in lib/config.ts, which are used to store scores, so don't change them.

export const STAGE1 = [
  {
    key: "rules",
    label: "Rules & guardrails",
    filteredOutIf: [
      { key: "not-individual", label: "Not individual work" },
      { key: "real-data", label: "Uses client or internal data" },
      { key: "key-in-code", label: "API key in the code" },
      { key: "not-vercel", label: "Not live on Vercel in JavaScript or Python" },
      { key: "outside-dates", label: "Submitted outside 27 Nov to 30 Nov, 2 PM" },
    ],
    scoredOn: [],
  },
  {
    key: "completeness",
    label: "Completeness",
    filteredOutIf: [
      { key: "no-end-to-end", label: "End-to-end workflow not implemented" },
      { key: "app-down", label: "The live app is down or broken" },
      { key: "not-agentic", label: "Not agentic: a single prompt, with no agent that plans, calls tools or acts" },
    ],
    scoredOn: ["Multi-agent orchestration", "Tool use, and how fully it works end to end"],
  },
  {
    key: "technical",
    label: "Technical execution",
    filteredOutIf: [
      { key: "bad-repo", label: "The GitHub repo is private, empty or does not match the live app" },
      { key: "crashes", label: "The app crashes during normal use" },
    ],
    scoredOn: ["Design principles and overall architecture", "Code quality, and how secrets and errors are handled"],
  },
] as const;

export const FILTER_REASONS: { key: string; label: string }[] = STAGE1.flatMap((g) => [...g.filteredOutIf]);
export const filterReasonLabel = (key: string) => FILTER_REASONS.find((r) => r.key === key)?.label ?? key;

/** The two criteria the architects give one team score for. */
export const STAGE1_SCORES = [
  { key: "completeness", label: "Completeness" },
  { key: "technical", label: "Technical execution" },
] as const;

/** The criteria management judges score in Stages 2 and 3. */
export type JudgedKey = "creativity" | "business" | "presentation";
export type JudgeStage = 2 | 3;

/** The criteria judges score. `listVar` is the Vercel setting that lists who scores it. */
export const JUDGED: { key: JudgedKey; label: string; stage: JudgeStage; listVar: string; scoredOn: string[] }[] = [
  {
    key: "creativity",
    label: "Creativity & uniqueness",
    stage: 2,
    listVar: "CREATIVITY_JUDGES",
    scoredOn: ["How original and fresh the idea is", "How specific the problem and its users are"],
  },
  {
    key: "business",
    label: "Business value",
    stage: 2,
    listVar: "BUSINESS_JUDGES",
    scoredOn: ["Whether SSI or a client would actually use it", "The value of the problem it solves"],
  },
  {
    key: "presentation",
    label: "Presentation & live product",
    stage: 3,
    listVar: "PRESENTATION_JUDGES",
    scoredOn: ["Aesthetics and functionality of the live app", "How clearly the app and summary present the solution"],
  },
];

/** The two judged stages: where each is scored and what it covers. */
export const JUDGE_STAGES: Record<JudgeStage, { stage: JudgeStage; title: string; short: string; path: string }> = {
  2: { stage: 2, title: "Stage 2: Creativity & business value", short: "Creativity & business value", path: "/judge" },
  3: { stage: 3, title: "Stage 3: Presentation & live product", short: "Presentation & live product", path: "/judge/stage-3" },
};

export const criteriaOf = (stage: JudgeStage) => JUDGED.filter((c) => c.stage === stage);
export const judgedLabel = (key: string) => JUDGED.find((c) => c.key === key)?.label ?? key;

export const SCALE = [
  { range: "1–3", label: "Weak", text: "Major gaps on this criterion" },
  { range: "4–6", label: "Adequate", text: "Meets the criterion, with clear room to improve" },
  { range: "7–8", label: "Strong", text: "Meets the criterion well, with minor gaps" },
  { range: "9–10", label: "Outstanding", text: "An exemplary entry on this criterion" },
];

export const FINAL_MAX = 50;
