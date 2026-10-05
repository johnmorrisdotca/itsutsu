import { Prisma } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { PUZZLE_KIND_LIST, PUZZLE_SPECS, levelsFor } from "@/lib/puzzles/puzzles.constants";
import { solveIp } from "./ladder";
import { pricedSolvesSql } from "./ladderSql";

/**
 * HOLDS THE LADDER IN SQL TO THE LADDER IN CODE (`ladderSql.ts`, `ladder.ts`):
 * seeds one solve for each size and level of every puzzle, at several scores
 * and with and without help, on YOUR development database, reads them back
 * through the query the boards use, and checks every figure against
 * `solveIp`. Writes only members named `ladder-sql-*` and their solves, and
 * removes them. Does nothing unless asked:
 *
 *   LADDER_SQL=1 pnpm exec vitest run src/lib/points/ladderSql.play.test.ts
 *
 * Never against the live database: it deletes what it made, but it is a write.
 */
const ASKED = process.env.LADDER_SQL === "1";
const MEMBER = "ladder-sql-member";

type Seed = { id: string; kind: string; size: number; level: string; givens: string; points: number; helps: number; solved: boolean; tiles: number };

function seeds(): Seed[] {
  const out: Seed[] = [];
  let n = 0;
  for (const kind of PUZZLE_KIND_LIST) {
    for (const size of PUZZLE_SPECS[kind].sizes) {
      for (const level of levelsFor(kind, size)) {
        for (const [points, helps, solved] of [
          [250, 0, true],
          [180, 2, true],
          [90, 3, true],
          [40, 0, false],
          [0, 4, true],
          [1500, 0, true],
        ] as const) {
          n += 1;
          // A Kumimoji's tiles are the length of its code.
          const tiles = kind === "kumimoji" ? 30 + ((n * 37) % 270) : 0;
          const givens = kind === "kumimoji" ? "k".repeat(tiles) : `grid-${n}`;
          out.push({ id: `ladder-sql-${n}`, kind, size, level, givens, points, helps, solved, tiles });
        }
      }
    }
  }
  return out;
}

describe.skipIf(!ASKED)("the ladder in SQL is the ladder in code", () => {
  afterAll(async () => {
    await prisma.puzzleSolve.deleteMany({ where: { memberId: MEMBER } });
    await prisma.member.deleteMany({ where: { id: MEMBER } });
  });

  it("prices every seeded solve as solveIp does", async () => {
    await prisma.member.upsert({ where: { id: MEMBER }, create: { id: MEMBER, name: "Ladder SQL" }, update: {} });
    const all = seeds();
    await prisma.puzzleSolve.deleteMany({ where: { memberId: MEMBER } });
    await prisma.puzzleSolve.createMany({
      data: all.map((s) => ({
        id: s.id,
        memberId: MEMBER,
        kind: s.kind,
        size: s.size,
        level: s.level,
        givens: s.givens,
        elapsedMs: 1000,
        points: s.points,
        // Half of the helps are Checks and half are Hints; their sum is what counts.
        checksUsed: Math.floor(s.helps / 2),
        hintsUsed: s.helps - Math.floor(s.helps / 2),
        solved: s.solved,
      })),
    });
    let checked = 0;
    for (const kind of PUZZLE_KIND_LIST) {
      const mine = all.filter((s) => s.kind === kind);
      const rows = await prisma.$queryRaw<{ ip: number; givens: string }[]>(
        Prisma.sql`SELECT ip, "givens" FROM (${pricedSolvesSql([kind], Prisma.empty, Prisma.sql` AND s."memberId" = ${MEMBER}`)}) AS priced`,
      );
      const byGivens = new Map(rows.map((row) => [row.givens, Number(row.ip)]));
      for (const s of mine) {
        const want = solveIp({ kind: s.kind as never, size: s.size, level: s.level as never, points: s.points, helps: s.helps, solved: s.solved, tiles: s.tiles || undefined });
        expect(byGivens.get(s.givens) ?? 0, `${s.kind} ${s.size} ${s.level} ${s.points}/${s.helps}/${s.solved}`).toBe(want);
        checked += 1;
      }
    }
    expect(checked).toBe(all.length);
  }, 120_000);
});
