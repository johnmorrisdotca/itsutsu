import { describe, expect, it } from "vitest";

// scripts/ is deliberately outside src/ — see that file's own header — so
// this reaches it by relative path rather than the @/ alias, which only
// resolves under src/. Importing it runs nothing but the pure functions
// below: main() is guarded to fire only when the file is the entry point.
import { compareVersions, higherVersion, nextVersion, planRelease, versionAlreadyTaken } from "../../../scripts/release-take.ts";

const CHANGELOG = `# Changelog

Prose.

## 0.150.0
- Something that shipped
`;

const PACKAGE_JSON = `{
  "name": "gomoku",
  "version": "0.150.0",
  "private": true
}
`;

const NOW = new Date("2026-09-12T03:04:05.000Z");

describe("nextVersion", () => {
  it("moves the minor and resets the patch, by default", () => {
    expect(nextVersion("0.150.0", "minor")).toBe("0.151.0");
    expect(nextVersion("0.150.7", "minor")).toBe("0.151.0");
  });

  it("moves the patch alone with --patch", () => {
    expect(nextVersion("0.150.0", "patch")).toBe("0.150.1");
  });
});

describe("higherVersion", () => {
  it("takes the remote when there is no local version yet", () => {
    expect(higherVersion("0.150.0", null)).toBe("0.150.0");
    expect(higherVersion("0.150.0", undefined)).toBe("0.150.0");
  });

  it("takes whichever of the two is further along", () => {
    expect(higherVersion("0.150.0", "0.151.0")).toBe("0.151.0");
    expect(higherVersion("0.151.0", "0.150.0")).toBe("0.151.0");
  });
});

describe("compareVersions", () => {
  it("orders by each part in turn", () => {
    expect(compareVersions("0.151.0", "0.150.9")).toBeGreaterThan(0);
    expect(compareVersions("0.150.1", "0.150.10")).toBeLessThan(0);
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
  });
});

describe("versionAlreadyTaken", () => {
  it("finds an exact heading", () => {
    expect(versionAlreadyTaken(CHANGELOG, "0.150.0")).toBe(true);
  });

  it("says no for a version the file has never named", () => {
    expect(versionAlreadyTaken(CHANGELOG, "0.151.0")).toBe(false);
  });

  it("says no for an empty changelog", () => {
    expect(versionAlreadyTaken("", "0.150.0")).toBe(false);
  });
});

describe("planRelease", () => {
  it("plans a minor release: a dated heading inserted above the rest, and the version replaced once", () => {
    const plan = planRelease({
      published: "0.150.0",
      changelog: CHANGELOG,
      packageJson: PACKAGE_JSON,
      step: "minor",
      summaries: ["A thing a player would notice"],
      now: NOW,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.version).toBe("0.151.0");
    expect(plan.changelog).toContain("## 0.151.0 — 2026-09-12\n- A thing a player would notice");
    // Above the existing heading, not below it.
    expect(plan.changelog.indexOf("0.151.0")).toBeLessThan(plan.changelog.indexOf("0.150.0"));
    expect(plan.packageJson).toContain('"version": "0.151.0"');
  });

  it("refuses a minor with no summary — a player-noticeable release says what it is", () => {
    const plan = planRelease({ published: "0.150.0", changelog: CHANGELOG, packageJson: PACKAGE_JSON, step: "minor", summaries: [], now: NOW });
    expect(plan).toMatchObject({ ok: false });
  });

  it("refuses a minor whose only summary is blank", () => {
    const plan = planRelease({
      published: "0.150.0",
      changelog: CHANGELOG,
      packageJson: PACKAGE_JSON,
      step: "minor",
      summaries: ["   "],
      now: NOW,
    });
    expect(plan).toMatchObject({ ok: false });
  });

  it("plans a patch with a summary: an entry is written, same as a minor", () => {
    const plan = planRelease({
      published: "0.150.0",
      changelog: CHANGELOG,
      packageJson: PACKAGE_JSON,
      step: "patch",
      summaries: ["A fix a player might notice"],
      now: NOW,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.version).toBe("0.150.1");
    expect(plan.changelog).toContain("## 0.150.1 — 2026-09-12");
  });

  it("plans a patch with no summary: the version moves, and the changelog is untouched", () => {
    const plan = planRelease({ published: "0.150.0", changelog: CHANGELOG, packageJson: PACKAGE_JSON, step: "patch", summaries: [], now: NOW });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.version).toBe("0.150.1");
    expect(plan.changelog).toBe(CHANGELOG);
    expect(plan.packageJson).toContain('"version": "0.150.1"');
  });

  it("refuses a version the changelog already holds", () => {
    const alreadyThere = CHANGELOG.replace("## 0.150.0", "## 0.151.0");
    const plan = planRelease({
      published: "0.150.0",
      changelog: alreadyThere,
      packageJson: PACKAGE_JSON,
      step: "minor",
      summaries: ["Anything"],
      now: NOW,
    });
    expect(plan).toEqual({ ok: false, error: "0.151.0 is already taken; fetch and try again." });
  });

  it("refuses when package.json does not hold the published version string", () => {
    const plan = planRelease({
      published: "0.150.0",
      changelog: CHANGELOG,
      packageJson: PACKAGE_JSON.replace("0.150.0", "0.149.9"),
      step: "minor",
      summaries: ["Anything"],
      now: NOW,
    });
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.error).toContain("does not hold");
  });

  it("writes one bullet per summary, in the order given", () => {
    const plan = planRelease({
      published: "0.150.0",
      changelog: CHANGELOG,
      packageJson: PACKAGE_JSON,
      step: "minor",
      summaries: ["First thing", "Second thing"],
      now: NOW,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.changelog).toContain("## 0.151.0 — 2026-09-12\n- First thing\n- Second thing\n");
  });
});
