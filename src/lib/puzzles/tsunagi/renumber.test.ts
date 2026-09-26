import { readFileSync } from "node:fs";

import { beforeAll, describe, expect, it } from "vitest";

import { loadEveryTsunagiLevel, TSUNAGI_LEVEL_COUNTS, TSUNAGI_SIZES, tsunagiBand, tsunagiLevelsOf } from "./levels";
import { TSUNAGI_RENUMBERED } from "./levels/renumbered.data";
import { isTwist } from "./ladder";
import { renumberedRecord } from "./renumber";

/**
 * THE RENUMBERING OF 2026-09-26 KEEPS EVERY STORED THING ON ITS BOARD.
 *
 * The same move is written twice — for browsers (`renumbered.data.ts`) and for
 * the database (the migration) — so the two are held to each other here, and
 * both to the levels as they now stand.
 */
beforeAll(loadEveryTsunagiLevel);

const MIGRATION = readFileSync("prisma/migrations/20260926130000_tsunagi_levels_renumbered/migration.sql", "utf8");

/** The (size, from, to, band) rows the migration moves stored rows by. */
function migrationMoves(): { size: number; from: number; to: number; band: string }[] {
  const block = MIGRATION.slice(MIGRATION.indexOf('INSERT INTO "tsunagi_renumber"'), MIGRATION.indexOf('CREATE TEMP TABLE "tsunagi_band"'));
  return [...block.matchAll(/\((\d+), (\d+), (\d+), '(\w+)'\)/g)].map((row) => ({ size: Number(row[1]), from: Number(row[2]), to: Number(row[3]), band: row[4]! }));
}

describe("the renumbering", () => {
  // The sizes that had levels before the renumbering: 10×10 and 11×11 came after it, with nothing to move.
  const RENUMBERED = TSUNAGI_SIZES.filter((size) => TSUNAGI_RENUMBERED[size] !== undefined);

  it("covers every size that had levels then, 4×4 to 9×9", () => {
    expect(RENUMBERED).toEqual([4, 5, 6, 7, 8, 9]);
  });

  it.each(RENUMBERED.map((size) => [size]))("moves each of the hundred old %i×%i levels to its own new number, no two to one", (size) => {
    const to = TSUNAGI_RENUMBERED[size]!;
    expect(to).toHaveLength(100);
    expect(new Set(to).size).toBe(100);
    for (const level of to) {
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(TSUNAGI_LEVEL_COUNTS[size]!);
    }
  });

  it("put John's four straight rows, old 4×4 level 10, at level 1", () => {
    expect(TSUNAGI_RENUMBERED[4]![9]).toBe(1);
    expect(tsunagiLevelsOf(4)[0]![0]).toBe("A..AB..BC..CD..D");
  });

  it("is the same move in the migration as in the browser's copy, with each board's new band", () => {
    const moves = migrationMoves();
    expect(moves).toHaveLength(600);
    for (const move of moves) {
      expect(move.to, `${move.size}×${move.size} old ${move.from}`).toBe(TSUNAGI_RENUMBERED[move.size]![move.from - 1]);
      expect(move.band).toBe(tsunagiBand(move.size, move.to));
    }
  });

  it("gave every plain level's board its band in the migration, for the solves kept by board", () => {
    // A twist board came after the renumbering, into a 15th or 16th nobody had played, so nothing stored needed its band.
    for (const size of TSUNAGI_SIZES.filter((each) => TSUNAGI_RENUMBERED[each] !== undefined)) {
      tsunagiLevelsOf(size).forEach(([layout], at) => {
        if (isTwist(layout)) return;
        expect(MIGRATION, `${size}×${size} level ${at + 1}`).toContain(`(${size}, '${layout}', '${tsunagiBand(size, at + 1)}')`);
      });
    }
  });

  it("moves each stored table through negative numbers, so no row lands on another's key on the way", () => {
    for (const table of ["PuzzleRun", "TsunagiAttempt"]) expect(MIGRATION).toMatch(new RegExp(`UPDATE "${table}" SET "(seed|level)" = -"(seed|level)"`));
    expect(MIGRATION).toContain('UPDATE "PuzzleRace"');
    expect(MIGRATION).toContain('UPDATE "PuzzleSolve"');
  });
});

describe("a browser's record, moved", () => {
  it("carries a time on old level 10 to the board's new number, and drops a number the old order never had", () => {
    const moved = renumberedRecord(4, { 10: 5_000, 101: 9_000 });
    expect(moved).toEqual({ 1: 5_000 });
  });

  it("moves nothing for a size it has no move for", () => {
    expect(renumberedRecord(12, { 1: 1 })).toEqual({});
  });
});
