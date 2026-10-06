import { Prisma } from "@prisma/client";

import type { HousekiKind } from "../houseki/houseki.types";
import { housekiPriceRows } from "./housekiLadder";

/**
 * THE HOUSEKI LADDER IN SQL: what `housekiPrice` says for every win a board
 * reads, in the one query that board already makes (`ipBoards.ts`). The prices
 * are a table of numbers written into the query, joined to the wins by campaign
 * and marks, so a win at a campaign or marks the ladder does not price has no
 * row and pays nothing. Nothing is stored, so a change to a price reprices every
 * win ever kept.
 *
 * Everything written into the query text is a number or a name from this code,
 * never anything a reader typed.
 */
export function housekiWinsSql(kinds: readonly HousekiKind[], when: Prisma.Sql, solver: Prisma.Sql): Prisma.Sql {
  const names = Prisma.join(kinds.map((kind) => Prisma.sql`${kind}`));
  const table = Prisma.raw(housekiPriceRows().map((row) => `('${row.campaign}', ${row.marks}, ${row.price}::float8)`).join(", "));
  // A level counts once and a Daily once a day: a row is one of each (`HousekiWin_memberId_kind_levelKey_key`), so the best is the row.
  return Prisma.sql`
    SELECT w."memberId", v."price" AS ip, w."finishedAt" AS at, w."kind" AS game
    FROM "HousekiWin" w
    JOIN (VALUES ${table}) AS v("campaign", "marks", "price") ON v."campaign" = w."campaign" AND v."marks" = w."marks"
    WHERE w."kind" IN (${names})${when}${solver}`;
}
