import { readFileSync } from "node:fs";

import { beforeAll, describe, expect, it } from "vitest";

import { isTwist, TSUNAGI_SIZES, tsunagiBand } from "@johnmorrisdotca/tsunagi";
import { TSUNAGI_RENUMBERED } from "@johnmorrisdotca/tsunagi/renumbered";

import { loadEveryTsunagiLevel, tsunagiLevelsOf } from "./levels";
import "./levelsModule";

/**
 * THE RENUMBERING OF 2026-09-26 KEPT EVERY STORED ROW ON ITS BOARD. The same
 * move is written twice — for browsers (Tsunagi's `renumbered` list) and for
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

describe("the renumbering's migration", () => {
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
