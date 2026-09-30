/**
 * The release history, read out of CHANGELOG.md.
 *
 * The board says what the site is not yet; this says what it already is. The
 * changelog is the record either way — it is written in the same commit as the
 * work, by the rule at the top of the file — so it is parsed rather than
 * copied. A second list of releases kept by hand would drift from the first
 * within a day.
 *
 * The format is the file's own: `## <version>` opens a release, and every
 * `- ` line under it is one of its notes.
 */

export type Release = {
  version: string;
  /**
   * The UTC calendar day `pnpm release:take` stamped this release with, or
   * null. Null is every release before board convergence ITS-04 shipped —
   * 151 of them, undated, and staying that way: the date is not derivable
   * after the fact (see the schema's own comment on `releasedAt`), and a
   * guessed one would be worse than an honest gap.
   */
  date: string | null;
  /**
   * The moment the release was taken, as an ISO instant in UTC, or null when
   * the heading carries only its day. `pnpm release:take` writes the minute
   * beside the day since 0.450.0; the dated releases before it had theirs
   * copied from their release commits, which the tool makes seconds before
   * the push. Four have no commit of their own (0.222.0 to 0.225.0, split out
   * of 0.221.0 afterwards) and keep the day alone rather than a borrowed time.
   */
  at: string | null;
  /** What changed, in a player's words. One line each, as the file has them. */
  notes: string[];
};

/**
 * `## 1.2.3` for an undated release, `## 1.2.3 — 2026-09-12` for one dated
 * to the day, or `## 1.2.3 — 2026-09-12 03:04 UTC` for one dated to the
 * minute, as `pnpm release:take` writes it now. Anything else after the
 * version — a stray word, a malformed date — is not a heading this reads as a release at all, which
 * is deliberate: a heading this cannot parse is a heading the file's own
 * rule does not recognise, and skipping it silently is safer than guessing
 * at what it meant.
 */
const HEADING = /^##\s+(\d+\.\d+\.\d+)(?:\s+[—-]\s+(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2})\s+UTC)?)?\s*$/;

/**
 * Every release in the changelog, newest first, as the file lists them.
 *
 * A heading with no notes under it is not a release — every release is written
 * with at least one line (`planRelease` refuses one without), so an empty one
 * is a mistake or a half-written entry, and either way there is nothing to
 * show for it.
 */
export function parseReleases(markdown: string): Release[] {
  const releases: Release[] = [];
  let current: Release | null = null;
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    const heading = HEADING.exec(line);
    if (heading !== null) {
      const at = heading[2] !== undefined && heading[3] !== undefined ? `${heading[2]}T${heading[3]}:00Z` : null;
      current = { version: heading[1], date: heading[2] ?? null, at, notes: [] };
      releases.push(current);
      continue;
    }
    if (current !== null && line.startsWith("- ")) current.notes.push(line.slice(2).trim());
  }
  return releases.filter((release) => release.notes.length > 0);
}

/** The newest release, or null for a changelog with nothing in it yet. */
export function latestRelease(releases: readonly Release[]): Release | null {
  return releases[0] ?? null;
}

/**
 * A version as numbers, for comparing. Anything unparseable sorts as zero
 * rather than throwing: a changelog is prose, and one malformed heading must
 * not take a page down.
 */
export function versionParts(version: string): number[] {
  return version.split(".").map((part) => {
    const value = Number.parseInt(part, 10);
    return Number.isNaN(value) ? 0 : value;
  });
}

/**
 * Which listed release the running edition belongs to.
 *
 * The running version is not always a heading in the file: until 0.186.1 a
 * patch with nothing to say was not listed, on the view that a fix or a chore
 * is not news a player would read. So an exact match found nothing the moment
 * such a patch shipped, and the list stopped saying which edition was being
 * served — which is the one thing a reader comes to it for.
 *
 * The edition being served is therefore the newest release at or below the
 * running version: on 0.64.1 that is 0.64.0, and everything in it is running.
 */
export function currentRelease(
  releases: readonly Release[],
  version: string,
): string | null {
  let best: string | null = null;
  for (const release of releases) {
    if (compareVersions(release.version, version) > 0) continue;
    if (best === null || compareVersions(release.version, best) > 0) best = release.version;
  }
  return best;
}

/** Negative when `a` is older than `b`, positive when newer, zero when the same. */
export function compareVersions(a: string, b: string): number {
  const left = versionParts(a);
  const right = versionParts(b);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
