import { Prisma } from "@prisma/client";

import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import { price, nativeReference } from "./ladder";
import { HELP_COST, KUMIMOJI_TILES_LEAST, KUMIMOJI_TILES_MOST, LEVEL_ADD, PUZZLE_PRICING } from "./ladder.constants";

/**
 * THE LADDER IN SQL: what `solveIp` (`ladder.ts`) computes for one solve, for
 * every solve a board reads, in the one query that board already makes. The
 * boards stay one grouped read: the prices are a table of constants written
 * into the query (a row for each size and level of the kinds asked for, so a
 * game's own board carries a few rows and the site's about three hundred),
 * joined to the solves by kind, size and level. Nothing is stored, so a change
 * to a price reprices every solve ever kept.
 *
 * Everything written into the query text is a number or a name from this code,
 * never anything a reader typed.
 */
const LEVELS: readonly PuzzleLevel[] = ["easy", "medium", "hard"];

/** The levels a kind's price rows are written for: the three every kind has, and extra hard for the kinds that offer it (a Pencil puzzle, Jirai), so no other kind's table grows. */
const levelsOf = (kind: PuzzleKind): readonly PuzzleLevel[] => (PUZZLE_SPECS[kind].levels.includes("extra-hard") ? [...LEVELS, "extra-hard"] : LEVELS);

/** Kumimoji's size is the hand it opens with, which prices nothing: its rung is read from the tiles in the bag. */
const KUMIMOJI_SIZE_KEY = 0;

/** The rows of the price table for these kinds: kind, size, level, the price, and the reference a scored-by-more-than-finishing puzzle's share is read against (null for one scored by the cell). */
function rows(kinds: readonly PuzzleKind[]): string {
  const out: string[] = [];
  for (const kind of kinds) {
    const pricing = PUZZLE_PRICING[kind];
    if (pricing.how === "tiles") {
      for (const level of LEVELS) out.push(`('${kind}', ${KUMIMOJI_SIZE_KEY}, '${level}', ${LEVEL_ADD[level]}, 0, ${pricing.full.each}::float8)`);
      continue;
    }
    for (const size of Object.keys(pricing.rungs).map(Number)) {
      const reference = nativeReference(kind, size);
      for (const level of levelsOf(kind)) {
        out.push(`('${kind}', ${size}, '${level}', ${price(kind, size, level)}, ${reference === null ? "NULL" : reference}::float8, 0::float8)`);
      }
    }
  }
  return out.join(", ");
}

/** Kumimoji's rung in SQL, from the length of the puzzle's code (its tiles): `kumimojiRung` in `ladder.ts`. */
const KUMIMOJI_RUNG = Prisma.raw(
  `LEAST(125, GREATEST(50, ROUND((50 + 75 * LN(GREATEST(LENGTH(s."givens"), 1)::float8 / ${KUMIMOJI_TILES_LEAST}) / LN(${KUMIMOJI_TILES_MOST}::float8 / ${KUMIMOJI_TILES_LEAST}))::numeric / 5) * 5))`,
);

/**
 * Every solve of these kinds, one row each, priced: (memberId, kind, givens,
 * finishedAt, ip). `when` and `solver` narrow the solves read (since a moment;
 * some members only) and are empty to read all. Joined to the price table by
 * kind, size and level, so a solve at a size or level the ladder does not
 * price has no row, and pays nothing.
 */
export function pricedSolvesSql(kinds: readonly PuzzleKind[], when: Prisma.Sql, solver: Prisma.Sql): Prisma.Sql {
  const helpCost = Prisma.raw(String(HELP_COST));
  const kumimojiSize = Prisma.raw(String(KUMIMOJI_SIZE_KEY));
  const names = Prisma.join(kinds.map((kind) => Prisma.sql`${kind}`));
  const table = Prisma.raw(rows(kinds));
  const reference = Prisma.raw(`(v."full" + v."per_tile" * LENGTH(s."givens"))`);
  const factor = Prisma.sql`CASE
        WHEN v."full" IS NULL AND v."per_tile" = 0 THEN s."points"::float8 / (s."points" + ${helpCost} * (COALESCE(s."checksUsed", 0) + COALESCE(s."hintsUsed", 0)))
        WHEN s."solved" THEN 0.5 + 0.5 * LEAST(1::float8, s."points"::float8 / ${reference})
        ELSE LEAST(1::float8, s."points"::float8 / ${reference})
      END`;
  return Prisma.sql`
    SELECT s."memberId", s."kind", s."givens", s."finishedAt",
      CASE WHEN s."points" <= 0 THEN 0::float8 ELSE GREATEST(5::float8,
        ROUND(((v."price" + CASE WHEN s."kind" = 'kumimoji' THEN ${KUMIMOJI_RUNG} ELSE 0 END)::float8 * (${factor}) / 5::float8)::numeric) * 5) END AS ip
    FROM "PuzzleSolve" s
    JOIN (VALUES ${table}) AS v("kind", "size", "level", "price", "full", "per_tile")
      ON v."kind" = s."kind" AND v."size" = CASE WHEN s."kind" = 'kumimoji' THEN ${kumimojiSize} ELSE s."size" END AND v."level" = s."level"
    WHERE s."kind" IN (${names})${when}${solver}`;
}

/**
 * A member's best solve of each grid, as rows of (memberId, ip, at, game): the
 * most any of their solves of that grid was worth, as the boards count it.
 */
export function bestSolvesSql(kinds: readonly PuzzleKind[], when: Prisma.Sql, solver: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`
    SELECT "memberId", MAX(ip) AS ip, MAX("finishedAt") AS at, "kind" AS game
    FROM (${pricedSolvesSql(kinds, when, solver)}) AS priced
    GROUP BY "memberId", "kind", "givens"`;
}
