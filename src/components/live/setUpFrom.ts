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
import { colourAfterSwap, opponentOf, seatOf } from "@/lib/history/rematch";
import { prisma } from "@/lib/prisma";
import { applyRulesChange, draftFromGame, type RulesDraft } from "./rulesDraft";
import { boardAsked, readSetUpAsked, type SetUpAsked } from "./setUpAsked";
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
  if (want.rematch !== null) return await fromFinishedGame(want.rematch, variant, want);
  if (want.from !== null) return await fromPosition(want.from, variant, want);

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
  const settledBoard = boardAsked(want, chosen);
  const liked = settledBoard ?? defaults.size;
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
    initial: askedOver(initial, want),
    asPlayed: null,
    boardChosen: settledBoard,
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

/**
 * A DRAFT WITH WHATEVER THE ADDRESS ACTUALLY SAID LAID OVER IT.
 *
 * The five parameters this screen started with were a head start on a form
 * somebody was still going to fill in. The doorstep needs the other thing: an
 * address that carries a FINISHED draft, both so that the page after this one
 * can state it and so that "change something" lands back here with every answer
 * still made. A round trip that dropped a field would put a game somebody had
 * not agreed to in front of them, looking exactly like one they had.
 *
 * Each field is laid over only where the address said something — `AskedRules`
 * keeps "said nothing" and "said this" apart precisely so this can. And it goes
 * through `applyRulesChange`, so a game and a board that cannot sit together are
 * brought into line here, the same way they are when somebody moves a control.
 *
 * A FORK IS THE EXCEPTION, and it is the same exception the creation route
 * makes. The board, the game, the obstacles, the opening and the handicap come
 * with the POSITION and are not anybody's to change — replaying the copied moves
 * onto another board would not be that position. So only the pace settings are
 * honoured, which is exactly the set `FORK_PACE_SETTINGS` names and the route
 * already lets a caller settle. Letting the rest through would put values in
 * this form that the route is right to throw away, which is the thing this
 * codebase calls a control whose answer is discarded.
 */
function askedOver(initial: RulesDraft, want: SetUpAsked, forked = false): RulesDraft {
  const said = want.rules;
  const pace: Partial<RulesDraft> = {
    ...(want.pace !== null ? { moveTimeMs: want.pace.ms } : {}),
    ...(said.clockMode !== null ? { clockMode: said.clockMode } : {}),
    ...(said.timeoutPenalty !== null ? { timeoutPenalty: said.timeoutPenalty } : {}),
    ...(said.allowResign !== null ? { allowResign: said.allowResign } : {}),
    ...(said.rated !== null ? { rated: said.rated } : {}),
  };
  if (forked) return applyRulesChange(initial, pace);

  /*
   * A BOARD ONLY WHERE THE GAME BEING ASKED FOR ACTUALLY OFFERS IT, and this is
   * not the same as letting `applyRulesChange` snap it.
   *
   * That function already refuses a board the picker has no block for — since
   * 0.158.7 it snaps through `boardSizesFor` rather than `sizeForVariant` — but it
   * snaps to the game's FIRST board, which is the right answer to "this draft
   * holds an impossible size" and the wrong one to "an address named a size this
   * game does not have". The second is an address that said nothing readable, and
   * silence here means the member's own standing board, exactly as it does on the
   * plain path above. Snapping instead would quietly move somebody from their
   * usual 15×15 to 9×9 because a link had a typo in it.
   */
  const variant = said.variant ?? (initial.variant as RuleVariant);
  const board = boardAsked(want, variant);

  return applyRulesChange(initial, {
    ...(said.variant !== null ? { variant: said.variant } : {}),
    ...(board !== null ? { size: board } : {}),
    ...(said.obstacles !== null ? { obstacles: said.obstacles } : {}),
    ...(said.opening !== null ? { opening: said.opening } : {}),
    ...(said.handicap !== null ? { handicap: said.handicap } : {}),
    ...pace,
  });
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
async function fromFinishedGame(
  id: string,
  variant: RuleVariant | null,
  want: SetUpAsked,
): Promise<SetUpFrom> {
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
  /*
   * TWO DRAFTS, ANSWERING DIFFERENT QUESTIONS.
   *
   * `asPlayed` is the game as it WAS played. `initial` is what this form opens
   * with, which is the same thing until an address says otherwise. One value
   * standing for both worked only while nothing could carry a changed rule back
   * here: `creationFor` asks whether the form still describes the game it was
   * filled in from, and now that the address can fill the form in itself, a
   * changed rule compared against itself would answer yes — asking the route for
   * a REMATCH, which takes every rule from the old game and would have thrown
   * the change silently away.
   */
  const asPlayed = { ...draftOf(origin), open: false };
  return {
    initial: askedOver(asPlayed, want),
    asPlayed,
    /*
     * A rematch's board comes off the game it repeats, which is not a default
     * the noticeboard may move — but it is not this screen's business either,
     * since a rematch is never matched to a stranger's seat at all. What IS
     * reported is the address, for the doorstep's "change something" round
     * trip: that carries the whole draft back here, and a board somebody
     * changed on the way must not read as one nobody touched.
     */
    boardChosen: boardAsked(want, asPlayed.variant as RuleVariant),
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
  asked: { id: string; move: number },
  variant: RuleVariant | null,
  want: SetUpAsked,
): Promise<SetUpFrom> {
  const blank = blankFrom(variant);
  const origin = await prisma.game.findUnique({ where: { id: asked.id }, select: GAME_FOR_SET_UP });
  if (origin === null) return { ...blank, problem: "There is no such game to play on from." };
  if (asked.move > origin.moveCount) {
    return { ...blank, problem: "That game has fewer moves than the position asked for." };
  }

  const mineId = await currentMemberId();
  const theirId = opponentOf(origin, mineId);
  const them = theirId === null ? null : await personNamed(theirId);
  /*
   * The colour whoever is forking keeps. A fork continues a position and a
   * position belongs to the colours that were in it, so the route hands the
   * forker their own seat back — and the doorstep can therefore say which colour
   * that is rather than leaving somebody to work it out from the board. Null
   * where this reader was not in the game at all, which forks into a board at
   * one screen and has no "your colour" to name.
   */
  const fork: SetUpFork = {
    id: origin.id,
    move: asked.move,
    alone: them === null,
    colour: seatOf(origin, mineId),
  };

  const asPlayed = { ...draftOf(origin), open: false };
  return {
    initial: askedOver(asPlayed, want, true),
    asPlayed,
    /*
     * Null, and not what the address said: a fork's board comes with the
     * POSITION, `askedOver` throws the asked board away for exactly that
     * reason, and reporting one here would claim the form holds a board it does
     * not. See `askedOver` — only the pace settings are a fork's to change.
     */
    boardChosen: null,
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
    asPlayed: null,
    /* Nothing was filled in at all, so nothing about the board was settled. */
    boardChosen: null,
    opponent: null,
    again: null,
    fork: null,
    carry: {},
    problem: null,
  };
}
