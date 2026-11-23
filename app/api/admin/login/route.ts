import { isRolePassword, roleCookie, roleToken, type StaffRole } from "@/lib/auth";
import { normalizeEmail } from "@/lib/validate";
import { cookies } from "next/headers";

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

const NOT_LISTED: Record<StaffRole, string> = {
  admin: "This email isn't on the admins list.",
  architect: "This email isn't on the architects list. Contact the organizers.",
  judge: "This email isn't on the judges list. Contact the organizers.",
};

// Each role signs in on its own page with a listed email + that role's password:
// /admin (admin password), /architect (architect password) and /judge (judge password).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const role: StaffRole = body.role === "judge" || body.role === "architect" ? body.role : "admin";
  const password = typeof body.password === "string" ? body.password : "";
  const email = normalizeEmail(body.email);

  if (isRolePassword(role, password)) {
    const t = roleToken(role, password, email);
    if (!t) return Response.json({ error: NOT_LISTED[role] }, { status: 403 });
    (await cookies()).set(roleCookie(role), t, COOKIE);
    return Response.json({ ok: true, role });
  }

  // Small delay slows down password guessing
  await new Promise((r) => setTimeout(r, 800));
  return Response.json({ error: "Wrong email or password." }, { status: 401 });
}
