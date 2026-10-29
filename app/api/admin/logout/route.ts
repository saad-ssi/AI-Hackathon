import { ADMIN_COOKIE, JUDGE_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";

// Signs out of one role ({ role: "admin" | "judge" }), or both if no role is given
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const jar = await cookies();
  if (body.role !== "judge") jar.delete(ADMIN_COOKIE);
  if (body.role !== "admin") jar.delete(JUDGE_COOKIE);
  return Response.json({ ok: true });
}
