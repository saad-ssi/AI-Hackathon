import { roleCookie, type StaffRole } from "@/lib/auth";
import { cookies } from "next/headers";

const ROLES: StaffRole[] = ["admin", "architect", "judge"];

// Signs out of one role ({ role: "admin" | "architect" | "judge" }), or all of them if no role is given
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const jar = await cookies();
  for (const role of ROLES) if (!body.role || body.role === role) jar.delete(roleCookie(role));
  return Response.json({ ok: true });
}
