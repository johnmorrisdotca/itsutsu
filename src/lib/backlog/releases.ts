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
  /** What changed, in a player's words. One line each, as the file has them. */
  notes: string[];
};

/**
 * `## 1.2.3` for an undated release, or `## 1.2.3 — 2026-09-12` for one
 * `pnpm release:take` dated. Anything else after the version — a stray word,
 * a malformed date — is not a heading this reads as a release at all, which
 * is deliberate: a heading this cannot parse is a heading the file's own
 * rule does not recognise, and skipping it silently is safer than guessing
 * at what it meant.
 */
const HEADING = /^##\s+(\d+\.\d+\.\d+)(?:\s+[—-]\s+(\d{4}-\d{2}-\d{2}))?\s*$/;

/**
 * Every release in the changelog, newest first, as the file lists them.
 *
 * A heading with no notes under it is not a release — the file's own rule is
 * that patch-only versions are not listed, so an empty one is a mistake or a
 * half-written entry, and either way there is nothing to show for it.
 */
export function parseReleases(markdown: string): Release[] {
  const releases: Release[] = [];
  let current: Release | null = null;
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    const heading = HEADING.exec(line);
    if (heading !== null) {
      current = { version: heading[1], date: heading[2] ?? null, notes: [] };
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
 * The running version is often not a heading in the file, and that is the
 * file's own rule rather than an oversight: patch-only versions are not
 * listed, because a fix or a chore is not news a player would read. So an
 * exact match finds nothing the moment a patch ships, and the list stops
 * saying which edition is being served — which is the one thing a reader
 * comes to it for.
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
