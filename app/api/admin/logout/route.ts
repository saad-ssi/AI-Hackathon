import { ADMIN_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  return Response.json({ ok: true });
}
