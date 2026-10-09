import { neon } from "@neondatabase/serverless";

export type Registration = {
  email: string;
  name: string;
  department: string;
  created_at: string;
  updated_at: string;
};

export type Submission = {
  email: string;
  project_name: string;
  use_case: string;
  repo_url: string;
  live_url: string;
  pitch: string;
  version: number;
  submitted_at: string;
  updated_at: string;
};

export type SubmissionVersion = Omit<Submission, "submitted_at" | "updated_at"> & {
  id: number;
  created_at: string;
};

export function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Connect a Neon database in Vercel's Storage tab.");
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

// Creates the tables on first use, so there is no separate migration step.
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const q = sql();
      await q`CREATE TABLE IF NOT EXISTS registrations (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS submissions (
        email TEXT PRIMARY KEY REFERENCES registrations(email),
        project_name TEXT NOT NULL,
        use_case TEXT NOT NULL,
        repo_url TEXT NOT NULL,
        live_url TEXT NOT NULL,
        pitch TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      // Every submit (including resubmits) is kept here, so nothing is ever overwritten for good.
      await q`CREATE TABLE IF NOT EXISTS submission_versions (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        version INTEGER NOT NULL,
        project_name TEXT NOT NULL,
        use_case TEXT NOT NULL,
        repo_url TEXT NOT NULL,
        live_url TEXT NOT NULL,
        pitch TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}
