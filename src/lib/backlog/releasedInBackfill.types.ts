/**
 * The vocabulary of the `releasedIn` backfill: what goes in, what comes out,
 * and what each refusal is called.
 *
 * Adjacent to `releasedInBackfill.ts` the way `backlog.types.ts` sits beside
 * `backlog.ts`, so the rules module and the script that feeds it can be read
 * without either one carrying the other's declarations.
 */

/** A done row that carries no release yet — the working set, as the board has it. */
export type BackfillRow = {
  key: string;
  title: string;
  status: string;
  /** ISO 8601, as the board hands dates up. */
  createdAt: string;
  /** ISO 8601. When the status last changed, so: when somebody closed it. */
  movedAt: string;
  releasedIn: string | null;
};

/**
 * Where a release's instant was measured, which decides how much it is worth.
 *
 *  - `version-bump`: the commit that first set `package.json` to this
 *    version. That is when the release went out, to the second.
 *  - `changelog-heading`: the commit that first wrote `## <version>` into
 *    CHANGELOG.md, used only where no bump commit exists. It says when the
 *    release was WRITTEN DOWN, which is not the same thing — 0.113.0 to
 *    0.120.0 are eight releases that shipped with no bump at all and were
 *    acknowledged a day later in one commit, and 0.2.0 to 0.32.0 were
 *    written retroactively when versioning arrived at 0.33.0. A row placed
 *    on one of these can have its VERSION believed and its INSTANT not, so
 *    it never reaches `certain`.
 */
export type InstantSource = "version-bump" | "changelog-heading";

/**
 * A release, with the instant git says it was taken.
 *
 * The changelog dates only the 32 releases `pnpm release:take` has written,
 * and the 168 that need placing are the undated ones — so the date comes from
 * git or not at all.
 */
export type ReleaseMoment = {
  version: string;
  /** The heading's own date where ITS-04 wrote one, else null. */
  date: string | null;
  notes: readonly string[];
  /** ISO 8601, or null where git has no commit to measure. */
  at: string | null;
  /** Which commit `at` was read from. */
  instantFrom: InstantSource | null;
  /** The commit, abbreviated, so a reader can go and look. */
  commit: string | null;
};

/** Which rule placed a row. */
export type EvidenceRule =
  /** The row's key, verbatim, in a release note. Nothing beats this. */
  | "key-in-notes"
  /** The row's title, near enough verbatim, quoted by a release note. */
  | "title-in-notes"
  /** The row's rare words matched one release and no other. */
  | "distinctive-words"
  /** A commit message named the key; the release is the first bump at or after it. */
  | "commit-names-key";

/** Why a row was placed where it was placed, in enough detail to be checked. */
export type Evidence = {
  rule: EvidenceRule;
  /** The changelog line or commit this rests on, quoted. */
  quote: string;
  /** How much of the row's distinctive wording the release accounted for, 0–1. */
  score: number;
  /** How many of the row's distinctive words the release actually used. */
  matchedWords: number;
  /** How many distinctive words the row had to match. */
  rowWords: number;
  /** The next best release and its score, so a near-tie is visible. */
  runnerUp: { version: string; score: number } | null;
  commit: string | null;
  instantFrom: InstantSource;
  /** When the row was closed, so the ordering can be seen rather than trusted. */
  closedAt: string;
};

/** One row placed in a release. */
export type Mapping = {
  key: string;
  title: string;
  releasedIn: string;
  /** ISO 8601: the instant git measured for that version. */
  releasedAt: string;
  evidence: Evidence;
  /** Only `certain` is ever written; the rest are for a person to read and judge. */
  confidence: "certain" | "likely" | "possible";
  /** Where the confidence is not `certain`, what held it back. */
  heldBackBy?: string;
};

export type UnmappedReason =
  /** A row `e2e/backlog.spec.ts` made and left behind; no release carried it. */
  | "test-litter"
  /** Nothing in any release entry is about this row. */
  | "no-release-names-it"
  /** Two or more releases fit the words as well as each other. */
  | "more-than-one-release-fits"
  /** Every release git can date went out after this row was closed. */
  | "no-release-before-the-closing"
  /** Not a done row, or already stamped: not this backfill's business. */
  | "not-an-unstamped-done-row";

/** One row nothing could place, and what stopped it. */
export type Unmapped = {
  key: string;
  title: string;
  reason: UnmappedReason;
  /** The same in words, with whatever numbers there are. */
  note: string;
  /** The best release the words got to, where there was one at all. */
  best: { version: string; score: number } | null;
};

export type BackfillPlan = {
  mapped: Mapping[];
  unmapped: Unmapped[];
};

export type BackfillOptions = {
  /** Commit subjects and bodies, for the `commit-names-key` rule. */
  commits?: readonly { sha: string; at: string; message: string }[];
};

/** How many rows landed at each confidence, and how many at each reason for not landing. */
export type BackfillTally = {
  certain: number;
  likely: number;
  possible: number;
  unmapped: number;
  reasons: Record<string, number>;
};
