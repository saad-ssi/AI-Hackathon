import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { EVENT, formatDate, getDates, ORGANIZER_COPIES } from "./config";
import { useCaseTitle } from "./validate";

// Confirmation emails through Amazon SES. Off until SES_* settings are added in Vercel;
// a failed email is logged and never blocks a registration or submission.
// (Vercel reserves the AWS_* names, hence the SES_* prefix.)

export function emailConfigured() {
  return Boolean(
    process.env.SES_REGION && process.env.SES_ACCESS_KEY_ID && process.env.SES_SECRET_ACCESS_KEY && process.env.EMAIL_FROM,
  );
}

// Emails come from a no-reply sender (alerts@ssidecisions.com), so point people elsewhere for help
function contactLine() {
  // CONTACT_EMAIL may list several addresses, comma-separated
  const list = (process.env.CONTACT_EMAIL || "").split(",").map((e) => e.trim()).filter(Boolean);
  if (list.length === 0) return "contact the hackathon organizers";
  const joined = list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")} or ${list.at(-1)}`;
  return `contact the organizers at ${joined}`;
}

const NO_REPLY = "This is an automated message. You cannot reply to this email.";

function siteUrl() {
  return (process.env.SITE_URL || "https://ssi-ai-hackathon.vercel.app").replace(/\/+$/, "");
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

type Section = { heading?: string; lines: string[] };

// Builds matching plain-text and HTML bodies from the same content
function render(greeting: string, intro: string, sections: Section[], closing: string) {
  const text = [greeting, "", intro, "", ...sections.flatMap((s) => [...(s.heading ? [s.heading] : []), ...s.lines.map((l) => `- ${l}`), ""]), closing, "", `${EVENT.name} organizers`, "", "--", NO_REPLY].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1f1f1f;max-width:600px">
<div style="background:#b91f2a;color:#fff;font-weight:700;padding:12px 16px">${esc(EVENT.org)} &middot; ${esc(EVENT.name)}</div>
<div style="padding:16px">
<p>${esc(greeting)}</p><p>${esc(intro)}</p>
${sections.map((s) => `${s.heading ? `<p style="margin-bottom:4px"><strong>${esc(s.heading)}</strong></p>` : ""}<ul style="margin-top:0">${s.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`).join("\n")}
<p>${esc(closing)}</p><p>${esc(EVENT.name)} organizers</p>
<p style="color:#7f7f7f;font-size:13px;border-top:1px solid #dcdcdc;padding-top:12px">${esc(NO_REPLY)}</p>
</div></div>`;
  return { text, html };
}

async function send(to: string, subject: string, body: { text: string; html: string }) {
  if (!emailConfigured()) return false;
  try {
    const client = new SESv2Client({
      region: process.env.SES_REGION,
      endpoint: process.env.SES_ENDPOINT || undefined, // only for local testing
      credentials: { accessKeyId: process.env.SES_ACCESS_KEY_ID!, secretAccessKey: process.env.SES_SECRET_ACCESS_KEY! },
    });
    const bcc = [...new Set([...(process.env.EMAIL_BCC || "").split(","), ...ORGANIZER_COPIES].map((e) => e.trim().toLowerCase()).filter(Boolean))]
      .filter((e) => e !== to.toLowerCase());
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: process.env.EMAIL_FROM,
        Destination: { ToAddresses: [to], BccAddresses: bcc.length ? bcc : undefined },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: { Text: { Data: body.text, Charset: "UTF-8" }, Html: { Data: body.html, Charset: "UTF-8" } },
          },
        },
      }),
    );
    return true;
  } catch (err) {
    console.error("Email failed:", err);
    return false;
  }
}

export async function sendRegistrationEmail(r: { email: string; name: string; department: string }, updated: boolean) {
  const d = getDates();
  const url = siteUrl();
  return send(
    r.email,
    updated ? `Registration updated: ${EVENT.name}` : `You're registered: ${EVENT.name}`,
    render(
      `Hi ${r.name},`,
      updated
        ? `Your registration for ${EVENT.name} has been updated.`
        : `Thanks for registering for ${EVENT.name}. This year's focus is agentic AI, ideally multi-agent workflows.`,
      [
        { heading: "Your details", lines: [`Name: ${r.name}`, `Department: ${r.department}`, `Email: ${r.email}`] },
        {
          heading: "Key dates",
          lines: [
            `Kickoff: ${formatDate(d.kickoff)}`,
            `Submissions close: ${formatDate(d.submissionsClose)}`,
            `Winners announced: ${formatDate(d.winnersAnnounced)}`,
          ],
        },
        {
          heading: "Next steps",
          lines: [
            "Watch your inbox for your personal LiteLLM API key.",
            `Set up GitHub and Vercel ahead of time with the guide: ${url}/guide`,
            `Pick your idea and read the must-haves: ${url}/use-cases`,
            `See how entries are scored: ${url}/rules`,
            `When your app is live, submit it with this same email: ${url}/submit`,
          ],
        },
      ],
      `Good luck, and enjoy building. Questions? Please ${contactLine()}.`,
    ),
  );
}

export async function sendSubmissionEmail(s: {
  email: string;
  projectName: string;
  useCase: string;
  repoUrl: string;
  liveUrl: string;
  pitch: string;
  version: number;
}) {
  const url = siteUrl();
  return send(
    s.email,
    s.version > 1 ? `Resubmission received (version ${s.version}): ${s.projectName}` : `Submission received: ${s.projectName}`,
    render(
      "Hi,",
      s.version > 1
        ? `We've received version ${s.version} of your ${EVENT.name} entry. This latest version is the one that will be evaluated.`
        : `We've received your ${EVENT.name} entry.`,
      [
        {
          heading: "What you submitted",
          lines: [
            `Project: ${s.projectName}`,
            `Use case: ${useCaseTitle(s.useCase)}`,
            `GitHub repo: ${s.repoUrl}`,
            `Live app: ${s.liveUrl}`,
            `Summary: ${s.pitch}`,
          ],
        },
        {
          heading: "Before the deadline",
          lines: [
            `You can resubmit as often as you like until ${getDates().submissionsClose ? formatDate(getDates().submissionsClose) : "the deadline"}: ${url}/submit`,
            "Keep your app live and working until winners are announced; evaluators open your live URL directly.",
            `If you didn't make this submission, ${contactLine()} straight away.`,
          ],
        },
      ],
      "Thanks for taking part.",
    ),
  );
}
