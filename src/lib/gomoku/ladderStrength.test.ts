import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { LADDER_FINGERPRINT_FILES, fingerprintOf, readLadderFingerprint } from "./ladderFingerprint";
import { measuredLadder } from "./ladderStrength";
import { LADDER_STRENGTH } from "./ladderStrength.data";
import { LADDER_STRENGTH_COMMAND, ladderStrengthSource } from "./ladderStrengthSource";
import type { LadderMeasurement, LadderStrengthTable } from "./ladderStrength.types";

/**
 * The strength table answers only for the code it measured.
 *
 * Nothing here plays a game — the round robin is `ladder.match.test.ts`, and it
 * is hours rather than seconds. What is checked is the part that must hold on
 * every build: a stale or missing measurement comes back as nothing, never as
 * a number, and the checked-in file is exactly what the generator writes.
 */

const REVERSI: LadderMeasurement = {
  variant: "reversi",
  size: 8,
  gamesPerPairing: 20,
  nodesPerMove: 4000,
  measuredOn: "2026-09-15",
  fingerprint: "measuredcode0001",
  tiers: ["dan", "meijin"],
  pairings: [{ first: "dan", second: "meijin", wins: 0, losses: 20, draws: 0 }],
};

const TABLE: LadderStrengthTable = { reversi: REVERSI };

describe("a game's measured strength", () => {
  it("is the row, when the row measured the current code", () => {
    expect(measuredLadder("reversi", "measuredcode0001", TABLE)).toBe(REVERSI);
  });

  it("is nothing for a game that has never been measured", () => {
    expect(measuredLadder("freestyle", "measuredcode0001", TABLE)).toBeNull();
  });

  it("is nothing when the row measured other code", () => {
    expect(measuredLadder("reversi", "someothercode002", TABLE)).toBeNull();
  });

  it("is nothing when the current code's fingerprint could not be read", () => {
    expect(measuredLadder("reversi", null, TABLE)).toBeNull();
  });
});

describe("the fingerprint", () => {
  const sources = [
    { path: "a.ts", text: "export const A = 1;" },
    { path: "b.ts", text: "export const B = 2;" },
  ];

  it("is the same for the same text, and moves when one character does", () => {
    expect(fingerprintOf(sources)).toBe(fingerprintOf(sources.map((one) => ({ ...one }))));
    const edited = [sources[0], { path: "b.ts", text: "export const B = 3;" }];
    expect(fingerprintOf(edited)).not.toBe(fingerprintOf(sources));
  });

  it("reads the current code from the files that decide a grade's play", () => {
    expect(LADDER_FINGERPRINT_FILES.length).toBeGreaterThan(0);
    const current = readLadderFingerprint();
    expect(current).toMatch(/^[0-9a-f]{16}$/);
    const text = LADDER_FINGERPRINT_FILES.map((path) => ({ path, text: readFileSync(path, "utf8") }));
    expect(current).toBe(fingerprintOf(text));
  });

  it("is nothing, rather than a partial hash, where the files cannot be read", () => {
    expect(readLadderFingerprint("/nowhere/that/holds/this/source")).toBeNull();
  });
});

describe("the checked-in table", () => {
  it("is exactly what the generator writes, so no row was edited by hand", () => {
    const onDisk = readFileSync("src/lib/gomoku/ladderStrength.data.ts", "utf8");
    expect(onDisk).toBe(ladderStrengthSource(LADDER_STRENGTH));
  });

  it("says in its header how to measure it again", () => {
    expect(ladderStrengthSource({})).toContain(LADDER_STRENGTH_COMMAND);
  });
});
