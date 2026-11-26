import { allowedDomains, OWN_IDEA, USE_CASES } from "./config";

export function clean(v: unknown, max = 500): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function normalizeEmail(v: unknown): string {
  return clean(v, 200).toLowerCase();
}

export function emailError(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
  const domain = email.split("@")[1];
  const allowed = allowedDomains();
  if (allowed.length && !allowed.includes(domain)) {
    return `Please use your company email (@${allowed.join(", @")}).`;
  }
  return null;
}

/**
 * Accepts any link into a GitHub repo, as people tend to paste it (http, www., .git, /tree/main, ?tab=...),
 * and returns the clean https://github.com/<owner>/<repo> address to store. Each rejection says what's wrong.
 */
export function checkRepoUrl(v: string): { url: string; error?: undefined } | { url?: undefined; error: string } {
  let u: URL;
  try {
    u = new URL(/^[a-z]+:\/\//i.test(v) ? v : `https://${v}`);
  } catch {
    return { error: "Your GitHub repo URL isn't a complete web address. Copy the link from your repo's page, like https://github.com/your-username/my-hack" };
  }
  const host = u.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    return { error: "Your repo URL must be a GitHub link, like https://github.com/your-username/my-hack" };
  }
  const [owner, repo] = u.pathname.split("/").filter(Boolean);
  if (!owner || !repo) {
    return { error: "That GitHub link is missing the repo name. Link to the repository itself, like https://github.com/your-username/my-hack, not your profile." };
  }
  return { url: `https://github.com/${owner}/${repo.replace(/\.git$/i, "")}` };
}

// Hosts that only work on the participant's own machine or network, never for evaluators
const PRIVATE_HOST = /(^|\.)(localhost|local|internal|lan|home|test|example|invalid)$/;

/**
 * Any public https address on any host, e.g. https://my-hack.vercel.app or https://huggingface.co/spaces/me/my-hack.
 * Each rejection says what's wrong, since the form shows this message as is.
 */
export function liveUrlError(v: string): string | null {
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return "Your live URL isn't a complete web address. Copy the full link from your browser's address bar, starting with https://";
  }
  if (u.protocol === "http:") {
    return "Your live URL starts with http://. Use the secure https:// version of the address (most hosts, including Vercel, provide it automatically).";
  }
  if (u.protocol !== "https:") return "Your live URL must be a web address starting with https://";
  if (u.username || u.password) {
    return "Remove the username and password from your live URL. Evaluators must be able to open your app without logging in.";
  }
  const host = u.hostname.toLowerCase();
  if (/^\d+(\.\d+){3}$/.test(host) || host.startsWith("[")) {
    return "Your live URL uses an IP address. Use your app's public web address instead, with a domain name like my-hack.vercel.app.";
  }
  if (!host.includes(".") || PRIVATE_HOST.test(host)) {
    return `"${host}" only works on your own computer or network, so evaluators can't open it. Deploy your app and use its public address, like https://my-hack.vercel.app.`;
  }
  if (!/^([a-z0-9-]+\.)+([a-z]{2,}|xn--[a-z0-9-]+)$/.test(host)) {
    return "Your live URL's domain doesn't look right. Copy the full link from your browser's address bar, like https://my-hack.vercel.app.";
  }
  return null;
}

export const USE_CASE_OPTIONS = [
  { id: OWN_IDEA.id, title: "My own idea" },
  ...USE_CASES.map((u) => ({ id: u.id, title: u.title })),
];

export function useCaseTitle(id: string): string {
  return USE_CASE_OPTIONS.find((o) => o.id === id)?.title ?? id;
}
