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

export type Score = {
  submission_email: string;
  judge: string;
  scores: Record<string, number>;
  total: number;
  /** The judge's Stage 2 comment */
  comment: string;
  /** The judge's Stage 3 comment */
  stage3_comment: string;
  updated_at: string;
};

/** Stage 1: the AI Architect team's decision on one entry (one row per entry, shared by the whole team). */
export type Screening = {
  submission_email: string;
  status: "passed" | "filtered";
  reasons: string[];
  note: string;
  completeness: number | null;
  technical: number | null;
  architect: string;
  updated_at: string;
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
      // One row per judge per entry, holding all their criteria (Stage 2 and Stage 3 saves are merged).
      // `comment` is the judge's Stage 2 comment and `stage3_comment` their Stage 3 one.
      await q`CREATE TABLE IF NOT EXISTS scores (
        submission_email TEXT NOT NULL REFERENCES submissions(email),
        judge TEXT NOT NULL,
        scores JSONB NOT NULL,
        total INTEGER NOT NULL,
        comment TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (submission_email, judge)
      )`;
      await q`ALTER TABLE scores ADD COLUMN IF NOT EXISTS stage3_comment TEXT NOT NULL DEFAULT ''`;
      // Stage 1: passed (with the team's Completeness and Technical scores) or filtered out (with reasons).
      // Only architects and admins see this; participants are never told.
      await q`CREATE TABLE IF NOT EXISTS screenings (
        submission_email TEXT PRIMARY KEY REFERENCES submissions(email),
        status TEXT NOT NULL CHECK (status IN ('passed', 'filtered')),
        reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
        note TEXT NOT NULL DEFAULT '',
        completeness INTEGER,
        technical INTEGER,
        architect TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      // New registrations wait here until the person enters the code we emailed them
      await q`CREATE TABLE IF NOT EXISTS pending_registrations (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ NOT NULL,
        sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}
