import type { ReportStatus } from "@/lib/sumilabu/reportsClient.types";

/** The contract's bounds (Sumilabu's `REPORTS_CONTRACT.md`, "Columns"), checked here before anything is sent. */
export const REPORT_LIMITS = {
  bodyMin: 3,
  bodyMax: 4000,
  pathMax: 500,
  versionMax: 40,
  refMax: 200,
  nameMax: 80,
} as const;

export const REPORT_STATUSES = {
  new: "new",
  read: "read",
  filed: "filed",
  closed: "closed",
} as const satisfies Record<ReportStatus, ReportStatus>;

/** Where an admin may move a report by hand. `filed` is reached only by filing it, never by a move. */
export const REPORT_MOVES: Readonly<Record<ReportStatus, readonly ReportStatus[]>> = {
  new: [REPORT_STATUSES.read, REPORT_STATUSES.closed],
  read: [REPORT_STATUSES.closed],
  filed: [REPORT_STATUSES.closed],
  closed: [],
};

export const REPORT_STATUS_LABEL: Readonly<Record<ReportStatus, string>> = {
  new: "New",
  read: "Read",
  filed: "Filed as a ticket",
  closed: "Closed",
};

/**
 * How long the server believes one health answer. The contract asks for about
 * thirty seconds, so a burst of people opening the window makes one call to
 * Sumilabu, not one each.
 */
export const REPORT_HEALTH_CACHE_MS = 30_000;
/** A health check slower than this counts as down. */
export const REPORT_HEALTH_TIMEOUT_MS = 2_000;
/** A send slower than this counts as failed, and the member keeps their words. */
export const REPORT_SEND_TIMEOUT_MS = 8_000;

/** The browser's opaque id for its reporter, in its own storage. Never a name, an address or an account. */
export const REPORTER_REF_KEY = "itsutsu-reporter-ref";
