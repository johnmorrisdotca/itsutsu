import { plainDraft } from "@/components/live/plainDraft";
import { applyRulesChange } from "@/components/live/rulesDraft";
import { seatIsThisGame } from "@/components/live/seatTerms";

import type { GameSummary } from "./gameHistory.types";
import { seatOnBoard } from "./seatOnBoard";

/**
 * THE SEATS THE LOBBY SENTENCE MAY NAME: only those the set-up screen will offer.
 *
 * The sentence on /games says "Sit down with X" when somebody is waiting at the
 * game, the board and the pace it shows, and its press leads to the set-up
 * screen with those three in the address. That screen offers a waiting seat
 * only when the seat's whole game is the one it is showing (`seatIsThisGame`),
 * and what it shows, for an address naming nothing else, is its plain pre-fill:
 * Free, rated, a per-move clock that costs the turn, no blocked points, no
 * handicap. So a seat is named here exactly when it would be offered there, for
 * a link naming that seat's own game, board and pace — the same pre-fill
 * (`plainDraft`), brought into line the same way (`applyRulesChange`).
 *
 * The sentence names a Pro seat, a friendly one, or one on a whole-game clock
 * nowhere, and says what it says of an empty board instead. Nothing here reads
 * who the reader is: the pre-fill does not depend on them once the address has
 * settled the board and the pace, which the sentence's link always does.
 *
 * NARROWED BEFORE IT IS CUT. The page keeps one seat of each game, pace and
 * board (`oneOfEachKind`), the newest; asked of the list after that, a newer
 * Pro seat is the one kept and an older Free seat of the same kind — which the
 * set-up screen would have offered — is already gone.
 */
export function seatsTheSentenceOffers(games: readonly GameSummary[]): GameSummary[] {
  return games.filter((game) => {
    const prefilled = applyRulesChange(
      plainDraft({ variant: game.variant, size: game.size, moveTimeMs: game.moveTimeMs }),
      {},
    );
    return prefilled.size === game.size && seatIsThisGame(seatOnBoard(game), prefilled);
  });
}
