import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "hackathon_admin";
export const JUDGE_COOKIE = "hackathon_judge";

function sessionToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw).update("ssi-hackathon-admin-session").digest("hex");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function passwordMatches(input: string): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || !safeEqual(input, pw)) return null;
  return sessionToken();
}

export async function isAdmin(): Promise<boolean> {
  const expected = sessionToken();
  if (!expected) return false;
  const jar = await cookies();
  const value = jar.get(ADMIN_COOKIE)?.value;
  return Boolean(value && safeEqual(value, expected));
}

// Judges are the people listed in the JUDGES setting, as "email=Name" entries separated by commas or new lines.
// They sign in with their email plus the shared JUDGE_PASSWORD. Scores are stored by email, so a judge is always
// the same person, and removing someone from JUDGES locks them out straight away.
export type Judge = { email: string; name: string };

export function judgeList(): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of (process.env.JUDGES || "").split(/[,\n]/)) {
    const [rawEmail, ...rest] = entry.split("=");
    const email = (rawEmail || "").trim().toLowerCase();
    if (email.includes("@")) map.set(email, rest.join("=").trim() || email);
  }
  return map;
}

export function judgeName(email: string): string {
  return judgeList().get(email) ?? email;
}

function judgeSignature(email: string): string | null {
  const pw = process.env.JUDGE_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw).update(`ssi-hackathon-judge:${email}`).digest("hex");
}

export function judgeConfigured() {
  return Boolean(process.env.JUDGE_PASSWORD) && judgeList().size > 0;
}

/** Returns a cookie token if the password is the judge password and the email is on the judges list. */
export function judgeToken(password: string, email: string): string | null {
  const pw = process.env.JUDGE_PASSWORD;
  if (!pw || !safeEqual(password, pw) || !judgeList().has(email)) return null;
  return `${Buffer.from(email, "utf8").toString("base64url")}.${judgeSignature(email)}`;
}

export function isJudgePassword(password: string) {
  const pw = process.env.JUDGE_PASSWORD;
  return Boolean(pw && safeEqual(password, pw));
}

export async function getJudge(): Promise<Judge | null> {
  const jar = await cookies();
  const value = jar.get(JUDGE_COOKIE)?.value;
  if (!value) return null;
  const [encoded, sig] = value.split(".");
  if (!encoded || !sig) return null;
  const email = Buffer.from(encoded, "base64url").toString("utf8");
  const expected = judgeSignature(email);
  const list = judgeList();
  if (!expected || !safeEqual(sig, expected) || !list.has(email)) return null;
  return { email, name: list.get(email)! };
}
