import { registrationOpen } from "@/lib/config";
import { ensureSchema, sql } from "@/lib/db";
import { clean, emailError, normalizeEmail } from "@/lib/validate";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Hidden field that only bots fill in
    if (clean(body.website)) return Response.json({ ok: true, updated: false });

    if (!registrationOpen()) {
      return Response.json({ error: "Registration is closed." }, { status: 403 });
    }

    const name = clean(body.name, 100);
    const department = clean(body.department, 100);
    const email = normalizeEmail(body.email);

    if (name.length < 2) return Response.json({ error: "Please enter your full name." }, { status: 400 });
    if (department.length < 2) return Response.json({ error: "Please enter your department." }, { status: 400 });
    const eErr = emailError(email);
    if (eErr) return Response.json({ error: eErr }, { status: 400 });
    if (body.confirm !== true) {
      return Response.json({ error: "Please confirm you'll take part and follow the rules." }, { status: 400 });
    }

    await ensureSchema();
    const q = sql();
    const existing = (await q`SELECT email FROM registrations WHERE email = ${email}`) as { email: string }[];
    const updated = existing.length > 0;

    await q`
      INSERT INTO registrations (email, name, department)
      VALUES (${email}, ${name}, ${department})
      ON CONFLICT (email) DO UPDATE
        SET name = EXCLUDED.name, department = EXCLUDED.department, updated_at = now()`;

    return Response.json({ ok: true, updated });
  } catch (err) {
    console.error("Registration failed:", err);
    return Response.json({ error: "Something went wrong saving your registration. Please try again." }, { status: 500 });
  }
}
