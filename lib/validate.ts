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

function parseUrl(v: string): URL | null {
  try {
    const u = new URL(v);
    return u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

export function repoUrlError(v: string): string | null {
  const u = parseUrl(v);
  if (!u || u.hostname !== "github.com" || u.pathname.split("/").filter(Boolean).length < 2) {
    return "GitHub repo URL should look like https://github.com/your-username/your-repo";
  }
  return null;
}

export function liveUrlError(v: string): string | null {
  const u = parseUrl(v);
  if (!u || !u.hostname.endsWith(".vercel.app")) {
    return "Live URL should be your Vercel address, like https://my-hack.vercel.app";
  }
  return null;
}

export const USE_CASE_OPTIONS = [
  ...USE_CASES.map((u) => ({ id: u.id, title: u.title })),
  { id: OWN_IDEA.id, title: "My own idea" },
];

export function useCaseTitle(id: string): string {
  return USE_CASE_OPTIONS.find((o) => o.id === id)?.title ?? id;
}
