import "server-only";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { parseHandicap } from "@/lib/history/gameSettingsSchema";
import { prisma } from "@/lib/prisma";
import { draftFromGame, type RulesDraft } from "./rulesDraft";
import { seatWhereFor } from "./seatWhere";

/**
 * A SEAT ON THE NOTICEBOARD, AS THE DOORSTEP HAS TO STATE IT.
 *
 * Asking for a game somebody is already asking for sits you down at their seat
 * rather than posting a second one beside it — see `matchSeat`, which is where
 * that decision is made. It means one press on the setup screen leads to a game
 * that already EXISTS, whose rules were settled by somebody else.
 *
 * Which is exactly why this path needs a doorstep too, and why the doorstep
 * states the ROW rather than the draft in its own address: the seat's own
 * values are the ones somebody would be agreeing to, and a confirmation that is
 * right about the headline and quietly wrong underneath is worse than none.
 *
 * AND THE ROW HAS TO BE THE GAME THAT WAS CHOSEN. The match used to be the
 * game, the board and the pace, so a reader who chose Pro was sent here to sit
 * at a stranger's Free seat, and this page then stated Free. The set-up screen
 * now matches on every term of the game (`seatIsThisGame`), and this asks the
 * database the same question of the one row before anybody is sat down at it —
 * so an address naming a seat whose game is not the draft's, a stale one or an
 * edited one, is refused as `other-rules` rather than honoured.
 */
export type SittingAt = {
  id: string;
  /** The rules that game is played under, which are nobody's to change now. */
  rules: RulesDraft;
  /** The free seat's colour: the one this reader would be taking. */
  mine: Stone;
  /** Whoever is already sitting there, as they are named. */
  who: string;
  /** Which colour opens, since a posted game may have been set either way. */
  opener: Stone;
};

/**
 * Why a posted seat cannot be sat down at, when it cannot.
 *
 * A refusal rather than a plausible fallback: silently making a second game
 * because somebody else took the seat first would be the site answering a
 * different question from the one that was asked, at the moment somebody pressed
 * a button that named a person.
 */
export type SeatGone = "taken" | "finished" | "missing" | "other-game" | "other-rules";

export async function sittingAt(
  id: string,
  variant: RuleVariant,
  /** The game the reader chose, which the seat's own game has to be. */
  asked: RulesDraft,
): Promise<{ seat: SittingAt; gone: null } | { seat: null; gone: SeatGone }> {
  const row = await prisma.game.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      variant: true,
      size: true,
      obstacles: true,
      opening: true,
      handicap: true,
      moveTimeMs: true,
      clockMode: true,
      timeoutPenalty: true,
      allowResign: true,
      rated: true,
      openSeat: true,
      opener: true,
      blackName: true,
      whiteName: true,
    },
  });
  if (row === null) return { seat: null, gone: "missing" };
  if (row.status !== "active") return { seat: null, gone: "finished" };
  /*
   * No seat posted any more means somebody answered it between the setup screen
   * reading the noticeboard and this page being opened — which is a race two
   * people asking for the same game will lose sometimes, and the honest thing to
   * do about it is say so.
   */
  if (row.openSeat === null) return { seat: null, gone: "taken" };
  /*
   * And it has to be a seat at the game this page is about. The setup screen only
   * ever matches a seat whose game equals the draft's, so this can only be an
   * address somebody edited — and a page stating one game while its button takes
   * a seat at another is the disagreement this whole area exists to stop.
   */
  if (row.variant !== variant) return { seat: null, gone: "other-game" };
  /*
   * The terms of the game, asked in SQL of this one row. A second read, and only
   * on the path that names a seat; a draft with a handicap is never a stranger's
   * seat, so it is refused without asking. Still an active game with a seat
   * posted, said again here so the query stands on its own rather than leaning
   * on the checks above it — which is also why it can never count a declined or
   * withdrawn offer as a seat.
   */
  const where = seatWhereFor(asked);
  const keeps =
    where === null
      ? 0
      : await prisma.game.count({ where: { ...where, id, status: "active", openSeat: { not: null } } });
  if (keeps === 0) return { seat: null, gone: "other-rules" };

  const mine = row.openSeat === STONES.black ? STONES.black : STONES.white;
  const theirs = mine === STONES.black ? row.whiteName : row.blackName;
  return {
    seat: {
      id: row.id,
      rules: draftFromGame({ ...row, handicap: parseHandicap(row.handicap) }),
      mine,
      who: theirs.trim() || "Somebody",
      opener: row.opener === STONES.white ? STONES.white : STONES.black,
    },
    gone: null,
  };
}
