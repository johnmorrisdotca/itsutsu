import type { HandicapTerms } from "@/lib/gomoku/gomoku.types";

import { gameRatingRefusal } from "./rateable";

/**
 * Whether the ladder counts this game: asked to be rated, and not refused by
 * the ladder's own rule.
 *
 * THE CONDITION EVERY ENDING APPLIES BEFORE `recordResult`, asked here and
 * nowhere else. Each of the four once wrote its own `!isHotSeat(row) &&
 * row.rated` in front of the writer — four copies of a rule, and not one of
 * them could see a handicap, so a handicap game moved both players' ratings
 * (John: "Fine don't"). They ask this now, `standings.coverage.test.ts` fails
 * any call to the writer that does not, and this asks `gameRatingRefusal`, so
 * the pages and the writers cannot drift.
 *
 * That function answers null for an UNRATED game with no handicap, because a
 * friendly is not a refusal; so `rated` is checked here too, and a friendly
 * counts for nothing. The XP upset bonus is paid only where this is true
 * (`playedRun.ts`): a rating gap no rated game ever tested is not a gap
 * anybody overturned.
 *
 * ITS OWN MODULE, holding the rule and nothing else, because the endings'
 * tests stand in for `playedRun` — it writes — and must still be asking the
 * real rule rather than a copy of it written into a mock.
 */
export function countsOnLadder(
  game: HandicapTerms & {
    rated: boolean;
    hotSeat: boolean;
    blackName: string;
    whiteName: string;
  },
): boolean {
  return game.rated && gameRatingRefusal(game) === null;
}
