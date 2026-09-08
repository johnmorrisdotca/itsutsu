import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { compareVersions, latestRelease, parseReleases, versionParts } from "./releases";
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

  it("reads an empty or wordless changelog as no releases at all", () => {
    expect(parseReleases("")).toEqual([]);
    expect(parseReleases("# Changelog\n\nNothing yet.\n")).toEqual([]);
    expect(latestRelease([])).toBeNull();
  });

  it("names the newest release", () => {
    expect(latestRelease(releases)?.version).toBe("0.51.0");
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
