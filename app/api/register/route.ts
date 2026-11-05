import { createHash, randomInt, timingSafeEqual } from "crypto";
import { registrationNotYetOpen, registrationOpen } from "@/lib/config";
import { ensureSchema, sql } from "@/lib/db";
import { sendRegistrationEmail, sendVerificationCode } from "@/lib/email";
import { clean, emailError, normalizeEmail } from "@/lib/validate";

// Registration happens in two steps, so only real, reachable SSI addresses can register:
//   1. { name, department, email, confirm }  -> we email a 6-digit code (nothing is registered yet)
//   2. { email, code }                        -> if the code matches, the registration is saved
// Keep these in step with the intervals in the SQL below
const CODE_MINUTES = 15;
const MAX_ATTEMPTS = 5;

type Pending = { email: string; name: string; department: string; code_hash: string; attempts: number; expired: boolean; recent: boolean };

const hashCode = (email: string, code: string) => createHash("sha256").update(`${email}:${code}`).digest("hex");

function sameHash(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Hidden field that only bots fill in
    if (clean(body.website)) return Response.json({ ok: true, codeSent: true });

    if (!registrationOpen()) {
      const error = registrationNotYetOpen() ? "Registration hasn't opened yet." : "Registration is closed.";
      return Response.json({ error }, { status: 403 });
    }

    const email = normalizeEmail(body.email);
    const eErr = emailError(email);
    if (eErr) return Response.json({ error: eErr }, { status: 400 });

    await ensureSchema();
    const q = sql();

    // ---------- Step 2: check the code, then register ----------
    if (body.code !== undefined) {
      const code = String(body.code).replace(/\s/g, "");
      const rows = (await q`
        SELECT *, expires_at < now() AS expired, false AS recent FROM pending_registrations WHERE email = ${email}`) as Pending[];
      const p = rows[0];
      if (!p) return Response.json({ error: "Please request a new code." }, { status: 400 });
      if (p.expired) return Response.json({ error: "That code has expired. Please request a new one." }, { status: 400 });
      if (p.attempts >= MAX_ATTEMPTS) return Response.json({ error: "Too many wrong codes. Please request a new one." }, { status: 429 });
      if (!/^\d{6}$/.test(code) || !sameHash(hashCode(email, code), p.code_hash)) {
        await q`UPDATE pending_registrations SET attempts = attempts + 1 WHERE email = ${email}`;
        const left = MAX_ATTEMPTS - p.attempts - 1;
        return Response.json(
          { error: left > 0 ? `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong codes. Please request a new one." },
          { status: 400 },
        );
      }

      const existing = (await q`SELECT email FROM registrations WHERE email = ${email}`) as { email: string }[];
      const updated = existing.length > 0;
      await q`
        INSERT INTO registrations (email, name, department)
        VALUES (${email}, ${p.name}, ${p.department})
        ON CONFLICT (email) DO UPDATE
          SET name = EXCLUDED.name, department = EXCLUDED.department, updated_at = now()`;
      await q`DELETE FROM pending_registrations WHERE email = ${email}`;

      // Confirmation email; failures are logged and never block the registration
      const emailed = await sendRegistrationEmail({ email, name: p.name, department: p.department }, updated);
      return Response.json({ ok: true, updated, emailed });
    }

    // ---------- Step 1: check the details, then email a code ----------
    const name = clean(body.name, 100);
    const department = clean(body.department, 100);
    if (name.length < 2) return Response.json({ error: "Please enter your full name." }, { status: 400 });
    if (department.length < 2) return Response.json({ error: "Please enter your department." }, { status: 400 });
    if (body.confirm !== true) {
      return Response.json({ error: "Please confirm you'll take part and follow the rules." }, { status: 400 });
    }

    const prev = (await q`
      SELECT *, false AS expired, sent_at > now() - interval '60 seconds' AS recent
      FROM pending_registrations WHERE email = ${email}`) as Pending[];
    if (prev[0]?.recent) {
      // A code went out moments ago: keep it, but take the latest details
      await q`UPDATE pending_registrations SET name = ${name}, department = ${department} WHERE email = ${email}`;
      return Response.json({ ok: true, codeSent: true, minutes: CODE_MINUTES, note: "We just sent you a code. Check your inbox (and junk folder)." });
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await q`
      INSERT INTO pending_registrations (email, name, department, code_hash, attempts, expires_at, sent_at)
      VALUES (${email}, ${name}, ${department}, ${hashCode(email, code)}, 0, now() + interval '15 minutes', now())
      ON CONFLICT (email) DO UPDATE
        SET name = EXCLUDED.name, department = EXCLUDED.department, code_hash = EXCLUDED.code_hash,
            attempts = 0, expires_at = EXCLUDED.expires_at, sent_at = now()`;

    const sent = await sendVerificationCode(email, name, code, CODE_MINUTES);
    if (!sent) {
      await q`DELETE FROM pending_registrations WHERE email = ${email}`;
      return Response.json({ error: "We couldn't send your code just now. Please try again in a minute." }, { status: 502 });
    }
    return Response.json({ ok: true, codeSent: true, minutes: CODE_MINUTES });
  } catch (err) {
    console.error("Registration failed:", err);
    return Response.json({ error: "Something went wrong saving your registration. Please try again." }, { status: 500 });
  }
}
