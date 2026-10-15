import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Two roles, set up the same way:
//   admins: listed in ADMINS, sign in with their email + ADMIN_PASSWORD
//   judges: listed in JUDGES, sign in with their email + JUDGE_PASSWORD
// Lists are "email=Name" entries separated by commas or new lines. The email is signed into the role's cookie,
// so we always know who is acting, and removing someone from a list locks them out straight away.

export const ADMIN_COOKIE = "hackathon_admin";
export const JUDGE_COOKIE = "hackathon_judge";

export type Person = { email: string; name: string };
export type Judge = Person;

type Role = { listVar: "ADMINS" | "JUDGES"; passwordVar: "ADMIN_PASSWORD" | "JUDGE_PASSWORD"; cookie: string; label: string };
const ADMIN: Role = { listVar: "ADMINS", passwordVar: "ADMIN_PASSWORD", cookie: ADMIN_COOKIE, label: "admin" };
const JUDGE: Role = { listVar: "JUDGES", passwordVar: "JUDGE_PASSWORD", cookie: JUDGE_COOKIE, label: "judge" };

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
  const pw = process.env[role.passwordVar];
  if (!pw) return null;
  return createHmac("sha256", pw).update(`ssi-hackathon-${role.label}:${email}`).digest("hex");
}

function passwordIs(role: Role, password: string) {
  const pw = process.env[role.passwordVar];
  return Boolean(pw && safeEqual(password, pw));
}

/** Cookie token if the password matches the role's password and the email is on the role's list. */
function token(role: Role, password: string, email: string): string | null {
  if (!passwordIs(role, password) || !parseList(process.env[role.listVar]).has(email)) return null;
  return `${Buffer.from(email, "utf8").toString("base64url")}.${signature(role, email)}`;
}

async function currentPerson(role: Role): Promise<Person | null> {
  const value = (await cookies()).get(role.cookie)?.value;
  if (!value) return null;
  const [encoded, sig] = value.split(".");
  if (!encoded || !sig) return null;
  const email = Buffer.from(encoded, "base64url").toString("utf8");
  const expected = signature(role, email);
  const list = parseList(process.env[role.listVar]);
  if (!expected || !safeEqual(sig, expected) || !list.has(email)) return null;
  return { email, name: list.get(email)! };
}

// ---- Admins ----
export const adminList = () => parseList(process.env.ADMINS);
export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD) && adminList().size > 0;
export const isAdminPassword = (password: string) => passwordIs(ADMIN, password);
export const adminToken = (password: string, email: string) => token(ADMIN, password, email);
export const getAdmin = () => currentPerson(ADMIN);
export async function isAdmin(): Promise<boolean> {
  return (await getAdmin()) !== null;
}

// ---- Judges ----
export const judgeList = () => parseList(process.env.JUDGES);
export const judgeName = (email: string) => judgeList().get(email) ?? email;
export const judgeConfigured = () => Boolean(process.env.JUDGE_PASSWORD) && judgeList().size > 0;
export const isJudgePassword = (password: string) => passwordIs(JUDGE, password);
export const judgeToken = (password: string, email: string) => token(JUDGE, password, email);
export const getJudge = () => currentPerson(JUDGE);
