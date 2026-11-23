import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { JUDGED, type JudgedKey, type JudgeStage } from "@/lib/judging";

// Three roles, set up the same way:
//   admins:     listed in ADMINS, sign in at /admin with their email + ADMIN_PASSWORD
//   architects: listed in ARCHITECTS, sign in at /architect with their email + ARCHITECT_PASSWORD
//               (or JUDGE_PASSWORD when ARCHITECT_PASSWORD isn't set)
//   judges:     listed in CREATIVITY_JUDGES, BUSINESS_JUDGES (Stage 2, /judge) and/or PRESENTATION_JUDGES
//               (Stage 3, /judge/stage-3), sign in with their email + JUDGE_PASSWORD, and score only the
//               criteria whose lists they're on. If none of those three lists is set, everyone in JUDGES scores all three.
// Lists are "email=Name" entries separated by commas or new lines. The email is signed into the role's cookie,
// so we always know who is acting, and removing someone from a list locks them out straight away.

export const ADMIN_COOKIE = "hackathon_admin";
export const JUDGE_COOKIE = "hackathon_judge";
export const ARCHITECT_COOKIE = "hackathon_architect";

export type Person = { email: string; name: string };
export type Judge = Person;
export type StaffRole = "admin" | "architect" | "judge";

type Role = { list: () => Map<string, string>; password: () => string | undefined; cookie: string; label: string };

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function parseList(value: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of (value || "").split(/[,\n]/)) {
    const [rawEmail, ...rest] = entry.split("=");
    const email = (rawEmail || "").trim().toLowerCase();
    if (email.includes("@")) map.set(email, rest.join("=").trim() || email);
  }
  return map;
}

function signature(role: Role, email: string): string | null {
  const pw = role.password();
  if (!pw) return null;
  return createHmac("sha256", pw).update(`ssi-hackathon-${role.label}:${email}`).digest("hex");
}

function passwordIs(role: Role, password: string) {
  const pw = role.password();
  return Boolean(pw && safeEqual(password, pw));
}

/** Cookie token if the password matches the role's password and the email is on the role's list. */
function token(role: Role, password: string, email: string): string | null {
  if (!passwordIs(role, password) || !role.list().has(email)) return null;
  return `${Buffer.from(email, "utf8").toString("base64url")}.${signature(role, email)}`;
}

async function currentPerson(role: Role): Promise<Person | null> {
  const value = (await cookies()).get(role.cookie)?.value;
  if (!value) return null;
  const [encoded, sig] = value.split(".");
  if (!encoded || !sig) return null;
  const email = Buffer.from(encoded, "base64url").toString("utf8");
  const expected = signature(role, email);
  const list = role.list();
  if (!expected || !safeEqual(sig, expected) || !list.has(email)) return null;
  return { email, name: list.get(email)! };
}

// ---- Role definitions ----
const listOf = (name: string) => parseList(process.env[name]);

/** Each judged criterion's judges. Falls back to JUDGES for all three when none of the lists is set. */
function judgedLists(): Map<JudgedKey, Map<string, string>> {
  const lists = new Map(JUDGED.map((c) => [c.key, listOf(c.listVar)]));
  if ([...lists.values()].every((l) => l.size === 0)) {
    const all = listOf("JUDGES");
    for (const c of JUDGED) lists.set(c.key, all);
  }
  return lists;
}

function allJudges(): Map<string, string> {
  const map = new Map<string, string>();
  for (const list of judgedLists().values()) for (const [email, name] of list) if (!map.has(email) || map.get(email) === email) map.set(email, name);
  return map;
}

const ADMIN: Role = { list: () => listOf("ADMINS"), password: () => process.env.ADMIN_PASSWORD, cookie: ADMIN_COOKIE, label: "admin" };
const JUDGE: Role = { list: allJudges, password: () => process.env.JUDGE_PASSWORD, cookie: JUDGE_COOKIE, label: "judge" };
const ARCHITECT: Role = {
  list: () => listOf("ARCHITECTS"),
  password: () => process.env.ARCHITECT_PASSWORD || process.env.JUDGE_PASSWORD,
  cookie: ARCHITECT_COOKIE,
  label: "architect",
};
const ROLES: Record<StaffRole, Role> = { admin: ADMIN, architect: ARCHITECT, judge: JUDGE };

export const roleCookie = (role: StaffRole) => ROLES[role].cookie;
export const isRolePassword = (role: StaffRole, password: string) => passwordIs(ROLES[role], password);
export const roleToken = (role: StaffRole, password: string, email: string) => token(ROLES[role], password, email);

// ---- Admins ----
export const adminList = () => ADMIN.list();
export const adminConfigured = () => Boolean(ADMIN.password()) && adminList().size > 0;
export const getAdmin = () => currentPerson(ADMIN);
export async function isAdmin(): Promise<boolean> {
  return (await getAdmin()) !== null;
}

// ---- Architects (Stage 1) ----
export const architectList = () => ARCHITECT.list();
export const architectName = (email: string) => architectList().get(email) ?? email;
export const architectConfigured = () => Boolean(ARCHITECT.password()) && architectList().size > 0;
export const getArchitect = () => currentPerson(ARCHITECT);

// ---- Judges (Stages 2 and 3) ----
export const judgeList = () => JUDGE.list();
export const judgeName = (email: string) => judgeList().get(email) ?? email;
export const judgeConfigured = () => Boolean(JUDGE.password()) && judgeList().size > 0;
export const getJudge = () => currentPerson(JUDGE);
/** The criteria this judge scores, in rubric order; only those in one stage when `stage` is given. */
export function judgeCriteria(email: string, stage?: JudgeStage): JudgedKey[] {
  const lists = judgedLists();
  return JUDGED.filter((c) => (!stage || c.stage === stage) && lists.get(c.key)?.has(email)).map((c) => c.key);
}
/** The stages (2 and/or 3) this judge scores in. */
export const judgeStages = (email: string): JudgeStage[] => ([2, 3] as JudgeStage[]).filter((st) => judgeCriteria(email, st).length > 0);
/** Who scores each judged criterion. */
export const judgedJudges = () => judgedLists();
