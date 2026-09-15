import "server-only";

import { Prisma } from "@prisma/client";

import type { RulesDraft } from "./rulesDraft";
import { seatTermsFor } from "./seatTerms";

/**
 * THE SAME RULE AS `seatIsThisGame`, ASKED OF THE DATABASE.
 *
 * The set-up screen decides which seat to offer in the browser, because it has
 * to answer again every time a setting changes and must not ask the server to
 * do it. The seat is TAKEN from the doorstep, and that is where the question
 * is put to the row itself, in SQL: whatever the address names, a seat is only
 * sat at when its game has these terms.
 *
 * Built from `seatTermsFor`, never restated, so a term added there is a column
 * compared here. Null for a draft with a handicap — no stranger's seat is ever
 * that game; see `seatTermsFor`.
 *
 * "No handicap" is stored three ways, and all three are this game: the column
 * left NULL (`liveGame.ts`), a JSON null (`liveGameSettings.ts`), and a
 * handicap object whose stone is null (`gameRecord.ts` stored what it was given)
 * — the same reading `parseHandicap` makes. A head start with no handicap is
 * stored as `{ headStart }` with no stone key at all (`storedHandicap`), and a
 * path to a key that is not there is SQL NULL rather than JSON null, so it
 * matches none of the three: a head-start game is never taken for an even one.
 */
export function seatWhereFor(asked: RulesDraft): Prisma.GameWhereInput | null {
  const terms = seatTermsFor(asked);
  if (terms === null) return null;
  const { clockMode, timeoutPenalty, ...always } = terms;
  return {
    ...always,
    size: asked.size,
    ...(clockMode === null ? {} : { clockMode }),
    ...(timeoutPenalty === null ? {} : { timeoutPenalty }),
    OR: [
      { handicap: { equals: Prisma.DbNull } },
      { handicap: { equals: Prisma.JsonNull } },
      { handicap: { path: ["stone"], equals: Prisma.JsonNull } },
    ],
  };
}
