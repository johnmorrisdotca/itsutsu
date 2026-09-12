import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { compareVersions, currentRelease, latestRelease, parseReleases, versionParts } from "./releases";
import { VERSION } from "@/lib/version";

const SAMPLE = `# Changelog

Prose about how versions are read here, with a - dash in it.

## 0.51.0
- A backlog 積み残し
- A second line for the same release

## 0.50.0
- Halma ハルマ

## 0.49.9
`;

describe("reading the changelog", () => {
  const releases = parseReleases(SAMPLE);

  it("takes a release per heading, newest first, in the file's order", () => {
    expect(releases.map((release) => release.version)).toEqual(["0.51.0", "0.50.0"]);
  });

  it("keeps every note under a heading, and nothing from the prose above the first one", () => {
    expect(releases[0].notes).toEqual(["A backlog 積み残し", "A second line for the same release"]);
    expect(releases[1].notes).toEqual(["Halma ハルマ"]);
  });

  it("drops a heading with nothing under it — a version with nothing to say is not a release", () => {
    expect(releases.map((release) => release.version)).not.toContain("0.49.9");
  });

  it("names each version once in the real changelog — 0.43.0 was a heading twice and counted twice", () => {
    /*
     * The numbers audit found `## 0.43.0` at two headings with different
     * notes under each, so /backlog and /admin said 168 releases for 167
     * versions. The parser takes a release per heading and had no reason to
     * notice. The notes were real and the second heading was not; they are
     * folded under one heading now, and this holds it there. A heading that
     * already exists is a version that already shipped, and a second block
     * under it is a mistake in the file, not a second release.
     */
    const real = parseReleases(readFileSync(join(process.cwd(), "CHANGELOG.md"), "utf8"));
    const seen = new Map<string, number>();
    for (const release of real) seen.set(release.version, (seen.get(release.version) ?? 0) + 1);
    const doubled = [...seen].filter(([, count]) => count > 1).map(([version]) => version);
    expect(doubled, "a version with two headings is counted as two releases").toEqual([]);
  });

  it("reads an empty or wordless changelog as no releases at all", () => {
    expect(parseReleases("")).toEqual([]);
    expect(parseReleases("# Changelog\n\nNothing yet.\n")).toEqual([]);
    expect(latestRelease([])).toBeNull();
  });

  it("names the newest release", () => {
    expect(latestRelease(releases)?.version).toBe("0.51.0");
  });
});

/**
 * Board convergence ITS-04: `pnpm release:take` writes the day it takes a
 * release, in the heading, because it is the one caller that knows it at the
 * moment it is true. Every release before it exists is undated on purpose —
 * a date guessed now would be a fact nobody established.
 */
describe("dated releases", () => {
  const DATED = `# Changelog

## 0.52.0 — 2026-09-12
- A dated release

## 0.51.0
- An undated one, from before this existed

## 0.50.0 — not a date
- A stray word after the version is not a release at all
`;

  it("parses a dated heading with its date", () => {
    const [dated] = parseReleases(DATED);
    expect(dated).toMatchObject({ version: "0.52.0", date: "2026-09-12" });
  });

  it("parses an undated heading with date null, not an empty string", () => {
    const [, undated] = parseReleases(DATED);
    expect(undated).toMatchObject({ version: "0.51.0", date: null });
  });

  it("does not read a stray word after the version as a release at all", () => {
    const versions = parseReleases(DATED).map((release) => release.version);
    expect(versions).not.toContain("0.50.0");
  });

  it("accepts an em dash or a hyphen between the version and the date", () => {
    expect(parseReleases("## 0.1.0 — 2026-01-01\n- x\n")[0].date).toBe("2026-01-01");
    expect(parseReleases("## 0.1.0 - 2026-01-01\n- x\n")[0].date).toBe("2026-01-01");
  });
});

describe("comparing versions", () => {
  it("orders by each part in turn", () => {
    expect(compareVersions("0.51.0", "0.50.9")).toBeGreaterThan(0);
    expect(compareVersions("0.50.1", "0.50.10")).toBeLessThan(0);
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
  });

  it("treats a part it cannot read as zero rather than throwing", () => {
    expect(versionParts("0.x.1")).toEqual([0, 0, 1]);
    expect(compareVersions("unreleased", "0.0.0")).toBe(0);
  });
});

/*
 * The changelog is a source of truth for a page now, not only a file people
 * read on GitHub, so it has to keep parsing. This reads the real one.
 */
describe("the site's own changelog", () => {
  const releases = parseReleases(readFileSync(join(process.cwd(), "CHANGELOG.md"), "utf8"));

  it("parses into a history with something in it", () => {
    expect(releases.length).toBeGreaterThan(10);
  });

  it("gives every release a version and at least one note", () => {
    for (const release of releases) {
      expect(release.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(release.notes.length).toBeGreaterThan(0);
      expect(release.notes[0].length).toBeGreaterThan(10);
    }
  });

  it("never names a version newer than the one package.json is on", () => {
    const newest = latestRelease(releases);
    expect(newest).not.toBeNull();
    // Patch-only versions go unlisted, so the newest entry may be behind — never ahead.
    expect(compareVersions(newest?.version ?? "0.0.0", VERSION)).toBeLessThanOrEqual(0);
  });
});

/**
 * Which release is the one running.
 *
 * The changelog's own rule is that patch-only versions are not listed, so the
 * running version is often not a heading in the file. An exact match would
 * then mark nothing, and the list would stop saying which edition is being
 * served — which is the one thing a reader comes to it for.
 */
describe("the edition being served", () => {
  const releases = [
    { version: "0.64.0", date: null, notes: ["latest"] },
    { version: "0.63.0", date: null, notes: ["before that"] },
    { version: "0.55.1", date: null, notes: ["a listed patch"] },
    { version: "0.55.0", date: null, notes: ["older"] },
  ];

  it("marks the release itself when the running version is one", () => {
    expect(currentRelease(releases, "0.63.0")).toBe("0.63.0");
  });

  it("marks the release a patch belongs to, since a patch has no entry", () => {
    expect(currentRelease(releases, "0.64.1")).toBe("0.64.0");
    expect(currentRelease(releases, "0.64.9")).toBe("0.64.0");
  });

  it("does not mark a release that has not shipped yet", () => {
    expect(currentRelease(releases, "0.63.4")).toBe("0.63.0");
    expect(currentRelease(releases, "0.55.2")).toBe("0.55.1");
  });

  it("marks nothing when the running version is older than anything listed", () => {
    expect(currentRelease(releases, "0.1.0")).toBeNull();
  });

  it("marks nothing at all rather than guessing, on an empty changelog", () => {
    expect(currentRelease([], "0.64.1")).toBeNull();
  });

  it("finds the newest match whatever order the file is in", () => {
    const shuffled = [releases[2], releases[0], releases[3], releases[1]];
    expect(currentRelease(shuffled, "0.64.1")).toBe("0.64.0");
  });

  it("marks a release for the version actually running here", () => {
    // The real file and the real package.json: whatever they say today, the
    // page must be able to name the edition it is serving.
    expect(currentRelease(parseReleases(readFileSync("CHANGELOG.md", "utf8")), VERSION)).not.toBeNull();
  });
});
