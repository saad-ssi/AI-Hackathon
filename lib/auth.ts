import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "hackathon_admin";

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
