import { ADMIN_COOKIE, adminToken, isAdminPassword, isJudgePassword, JUDGE_COOKIE, judgeToken } from "@/lib/auth";
import { normalizeEmail } from "@/lib/validate";
import { cookies } from "next/headers";

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

// One sign-in for both roles, each by email: a listed admin's email + the admin password opens the admin view;
// a listed judge's email + the judge password opens the scoring view.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const email = normalizeEmail(body.email);
  const jar = await cookies();

  if (isAdminPassword(password)) {
    const t = adminToken(password, email);
    if (!t) return Response.json({ error: "This email isn't on the admins list." }, { status: 403 });
    jar.set(ADMIN_COOKIE, t, COOKIE);
    return Response.json({ ok: true, role: "admin" });
  }

  if (isJudgePassword(password)) {
    const t = judgeToken(password, email);
    if (!t) return Response.json({ error: "This email isn't on the judges list. Contact the organizers." }, { status: 403 });
    jar.set(JUDGE_COOKIE, t, COOKIE);
    return Response.json({ ok: true, role: "judge" });
  }

  // Small delay slows down password guessing
  await new Promise((r) => setTimeout(r, 800));
  return Response.json({ error: "Wrong email or password." }, { status: 401 });
}
