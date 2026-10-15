import { ADMIN_COOKIE, isJudgePassword, JUDGE_COOKIE, judgeToken, passwordMatches } from "@/lib/auth";
import { normalizeEmail } from "@/lib/validate";
import { cookies } from "next/headers";

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

// One sign-in for both roles: the admin password opens the admin view;
// a listed judge's email plus the judge password opens the scoring view.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const email = normalizeEmail(body.email);
  const jar = await cookies();

  const adminToken = passwordMatches(password);
  if (adminToken) {
    jar.set(ADMIN_COOKIE, adminToken, COOKIE);
    return Response.json({ ok: true, role: "admin" });
  }

  if (isJudgePassword(password)) {
    const token = judgeToken(password, email);
    if (!token) {
      return Response.json({ error: "This email isn't on the judges list. Contact the organizers." }, { status: 403 });
    }
    jar.set(JUDGE_COOKIE, token, COOKIE);
    return Response.json({ ok: true, role: "judge" });
  }

  // Small delay slows down password guessing
  await new Promise((r) => setTimeout(r, 800));
  return Response.json({ error: "Wrong email or password." }, { status: 401 });
}
