import "server-only";

import { currentMemberId } from "@/lib/auth/currentSession";
import type { GameDefaults } from "@/components/game/gameDefaults";
import { isBotId } from "@/lib/bots/bots";
import { gamesPlayedBy } from "@/lib/bots/bots.constants";
import {
  DEFAULT_SETTINGS,
  NO_HANDICAP,
  OPENING_RULES,
  boardSizesFor,
  sizeForVariant,
} from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { parseHandicap } from "@/lib/history/gameSettingsSchema";
import { colourAfterSwap, opponentOf } from "@/lib/history/rematch";
import { prisma } from "@/lib/prisma";
import { draftFromGame, type RulesDraft } from "./rulesDraft";
import { readSetUpAsked } from "./setUpAsked";
import type { SetUpAgain, SetUpFork, SetUpFrom, SetUpOpponent } from "./setUp.types";

/**
 * THE SETUP SCREEN, PRE-FILLED FROM WHAT THE ADDRESS ALREADY KNOWS.
 *
 * Both setup pages call this, which is the point of it: /games/new and
 * /games/<game>/new are one screen with one difference — whether the game is
 * still a choice — and the reading of the address had no business being done
 * twice. Two copies of "a rematch takes the colours from the game it repeats"
 * is one rule that can drift.
 *
 * WHAT IT COSTS. Nothing, unless the address asked for something: no parameter
 * means no query. Where one does, it is the same read the creation route used
 * to make on the way to writing a game — a rematch looked its source game up
 * and then looked the opponent up — moved from the moment of writing to the
 * moment of asking. So no page here makes a query the same errand did not
 * already make; it makes them one screen earlier, and to a person rather than
 * to a row.
 */
export async function setUpFrom({
  variant,
  asked,
  defaults,
}: {
  /** The game the address names, or null at /games/new where it is still a choice. */
  variant: RuleVariant | null;
  asked: Record<string, string | string[] | undefined>;
  defaults: GameDefaults;
}): Promise<SetUpFrom> {
  const want = readSetUpAsked(asked);

  /*
   * A rematch and a fork both start from a game that exists, so they are read
   * first: what they find decides the game, the board and every rule, and the
   * plain path below only has the member's own defaults to go on.
   */
  if (want.rematch !== null) return await fromFinishedGame(want.rematch, variant);
  if (want.from !== null) return await fromPosition(want.from, variant);

  const opponent = want.against === null ? null : await personNamed(want.against);
  /*
   * THE GAME, WHICH A NAMED COMPUTER PLAYER CAN DECIDE WHEN THE ADDRESS HAS NOT.
   *
   * The graded five play everything and settle nothing. A SPECIALIST plays one
   * game — away from its own board it is somebody else under another name — so
   * arriving from its Play button at the site's default game would show it as the
   * chosen opponent while the list of players offered at that game did not hold
   * it, and pressing Start would quietly post a seat for anyone instead of
   * playing the program somebody had just pressed Play on.
   *
   * Only where the ADDRESS has not already named a game. There the address wins:
   * it is identity, and a screen that moved the game out from under its own
   * address would be the thing this whole area exists to stop. That case falls
   * through to the chooser saying out loud that the named player is not offered
   * here — see `SetUpGame`.
   */
  const chosen =
    variant ??
    (opponent !== null && opponent.computer ? (gamesPlayedBy(opponent.id)[0] ?? null) : null) ??
    (DEFAULT_SETTINGS.variant as RuleVariant);
  const sizes = boardSizesFor(chosen);
  /*
   * The board: whichever was asked for if this game has it, else the member's
   * standing size if this game has that, else this game's own first board. A
   * standing board size is a wish rather than an instruction — a game with one
   * board gets that board, whatever anybody usually likes.
   */
  const liked = want.board !== null && sizes.includes(want.board) ? want.board : defaults.size;
  const initial: RulesDraft = {
    variant: chosen,
    size: sizeForVariant(chosen, sizes.includes(liked) ? liked : sizes[0]),
    obstacles: "none",
    opening: OPENING_RULES.free,
    moveTimeMs: want.pace === null ? defaults.moveTimeMs : want.pace.ms,
    timeoutPenalty: "turn",
    clockMode: "move",
    rated: true,
    allowResign: true,
    open: true,
    handicap: NO_HANDICAP,
  };

  return {
    initial,
    opponent,
    again: null,
    fork: null,
    carry: {},
    problem:
      want.against !== null && opponent === null
        ? "Whoever that link named cannot be reached for a game. Pick somebody below."
        : null,
  };
}

/** The member or program an `against` names, or null where there is no such player. */
async function personNamed(id: string): Promise<SetUpOpponent | null> {
  const member = await prisma.member.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (member === null) return null;
  const computer = isBotId(member.id);
  /*
   * Somebody a game can actually be offered to. A kept record — a name and a
   * history and no address, because they never signed in — is nobody to
   * challenge, and the creation route says the same thing about it. A computer
   * player has no address either and is the one exception, because it does not
   * need one to answer.
   */
  if (member.email === null && !computer) return null;
  return { id: member.id, name: member.name, computer };
}

/** The rows a rematch or a fork reads its rules out of. One shape, read once. */
const GAME_FOR_SET_UP = {
  id: true,
  status: true,
  variant: true,
  size: true,
  obstacles: true,
  opening: true,
  handicap: true,
  seed: true,
  opener: true,
  winLength: true,
  drawLimit: true,
  moveTimeMs: true,
  clockMode: true,
  timeoutPenalty: true,
  allowResign: true,
  rated: true,
  moveCount: true,
  blackMemberId: true,
  whiteMemberId: true,
  /*
   * The names as played. Not shown anywhere here — the opponent is named from
   * their member row, which follows a rename — but `opponentOf` and
   * `colourAfterSwap` take a whole `PlayedGame`, and one shape read once is
   * better than a second narrower type describing the same row.
   */
  blackName: true,
  whiteName: true,
} as const;

/**
 * Playing a finished game again.
 *
 * The screen opens as a CONFIRMATION: every rule is the one that game was
 * played under, the opponent is the one who played it, and the colour is the
 * other one — a rematch swaps, because black moves first and in a
 * five-in-a-row that is worth measuring. Nothing is locked. John's whole
 * reason for wanting this screen in front of a rematch was "I want to
 * definitely play Bob at Reversi, but I want to try that variant, and change
 * some rules", and a screen that would not let him is a screen that failed at
 * the one thing it was asked for.
 */
async function fromFinishedGame(id: string, variant: RuleVariant | null): Promise<SetUpFrom> {
  const blank = blankFrom(variant);
  const origin = await prisma.game.findUnique({ where: { id }, select: GAME_FOR_SET_UP });
  if (origin === null) return { ...blank, problem: "There is no such game to play again." };
  if (origin.status === "active") {
    return { ...blank, problem: "That game is still being played, so there is nothing to play again yet." };
  }

  const mineId = await currentMemberId();
  const theirId = opponentOf(origin, mineId);
  const colour = colourAfterSwap(origin, mineId);
  if (theirId === null || colour === null) {
    return { ...blank, problem: "You did not play that game, so there is no rematch of it to offer." };
  }
  const them = await personNamed(theirId);
  if (them === null) {
    return { ...blank, problem: "Whoever you played that game against cannot be reached for another." };
  }

  const again: SetUpAgain = { id: origin.id, colour };
  return {
    initial: { ...draftOf(origin), open: false },
    opponent: them,
    again,
    fork: null,
    carry: carriedFrom(origin),
    problem: null,
  };
}

/**
 * Carrying a position out of another game.
 *
 * The board, the game, the obstacles and the opening come with the position and
 * are not this screen's to change — a Reversi position is not a Halma one, and
 * offering to make it one would be a control that does nothing. The clock, the
 * penalty, resigning and whether it counts are the NEW game's own business, so
 * those stay editable with the source's own values already in them.
 */
async function fromPosition(
  want: { id: string; move: number },
  variant: RuleVariant | null,
): Promise<SetUpFrom> {
  const blank = blankFrom(variant);
  const origin = await prisma.game.findUnique({ where: { id: want.id }, select: GAME_FOR_SET_UP });
  if (origin === null) return { ...blank, problem: "There is no such game to play on from." };
  if (want.move > origin.moveCount) {
    return { ...blank, problem: "That game has fewer moves than the position asked for." };
  }

  const mineId = await currentMemberId();
  const theirId = opponentOf(origin, mineId);
  const them = theirId === null ? null : await personNamed(theirId);
  const fork: SetUpFork = { id: origin.id, move: want.move, alone: them === null };

  return {
    initial: { ...draftOf(origin), open: false },
    opponent: them,
    again: null,
    fork,
    carry: carriedFrom(origin),
    problem: null,
  };
}

/** A game's rules as this form edits them. */
function draftOf(origin: {
  variant: string;
  size: number;
  obstacles: string;
  opening: string;
  handicap: unknown;
  moveTimeMs: number | null;
  clockMode: string;
  timeoutPenalty: string;
  allowResign: boolean;
  rated: boolean;
}): RulesDraft {
  return draftFromGame({ ...origin, openSeat: null, handicap: parseHandicap(origin.handicap) });
}

/**
 * WHAT COMES WITH A GAME AND HAS NO ROW ON THIS FORM.
 *
 * The line length is the one that matters and the reason this exists: a
 * freestyle game agreed at three in a row is a real game somebody played, and
 * a rematch of it that changed the clock would otherwise have come back needing
 * five — unwinnable on the board it was played on, which is exactly the shape
 * of bug John found in a rematched game of noughts and crosses. The seed comes
 * too, so a variant that scatters obstacles scatters them the same way, and a
 * rematch on a different board would not be a rematch.
 */
function carriedFrom(origin: {
  seed: number;
  opener: string;
  winLength: number;
  drawLimit: string;
}): Record<string, unknown> {
  return {
    seed: origin.seed,
    opener: origin.opener,
    winLength: origin.winLength,
    drawLimit: origin.drawLimit,
  };
}

/**
 * The screen with nothing filled in, for an address that asked for something
 * that is not there.
 *
 * A refusal still has to be a usable screen: somebody who followed a rematch
 * link to a game that has been swept wants to start a game, not to be told
 * there is no page here. So the problem is said and the form beneath it works.
 */
function blankFrom(variant: RuleVariant | null): SetUpFrom {
  const chosen = variant ?? (DEFAULT_SETTINGS.variant as RuleVariant);
  const sizes = boardSizesFor(chosen);
  return {
    initial: {
      variant: chosen,
      size: sizeForVariant(chosen, sizes[0]),
      obstacles: "none",
      opening: OPENING_RULES.free,
      moveTimeMs: null,
      timeoutPenalty: "turn",
      clockMode: "move",
      rated: true,
      allowResign: true,
      open: true,
      handicap: NO_HANDICAP,
    },
    opponent: null,
    again: null,
    fork: null,
    carry: {},
    problem: null,
  };
}
