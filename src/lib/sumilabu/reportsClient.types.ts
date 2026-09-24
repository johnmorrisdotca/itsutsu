/** Where a report stands on Sumilabu (`REPORTS_CONTRACT.md`, "Moves"). */
export type ReportStatus = "new" | "read" | "filed" | "closed";

/** A report as Sumilabu hands it back. */
export type Report = {
  id: string;
  body: string;
  /** The page the member had open, with no query string: the client strips it before sending. */
  path: string;
  appVersion: string | null;
  /** An opaque id the browser minted, never a person. */
  reporterRef: string;
  reporterName: string | null;
  status: ReportStatus;
  filedTicketId: string | null;
  /** Whether a screenshot came with it. The bytes are asked for on their own (`reportImage`). */
  hasImage?: boolean;
  createdAt: string;
};

/** What a member sends. `reporterName` is null for a reader who is not signed in. */
export type ReportDraft = {
  body: string;
  path: string;
  appVersion: string;
  reporterRef: string;
  reporterName: string | null;
  /** A screenshot, JPEG, PNG or WebP, as plain base64 with no `data:` prefix; up to 1 MiB decoded. */
  image?: string;
};

/** A screenshot as Sumilabu hands it back: its type, read off its first bytes there, and the bytes. */
export type ReportImage = { type: string; bytes: ArrayBuffer };

/** How a send went, in the words the window shows. */
export type ReportSent =
  | { ok: true }
  | { ok: false; reason: "invalid"; problem: string }
  | { ok: false; reason: "rateLimited"; retryAfterSeconds: number }
  | { ok: false; reason: "unreachable" };

/** An admin's move or filing, answered plainly. */
export type ReportChanged = { ok: true } | { ok: false; problem: string };
