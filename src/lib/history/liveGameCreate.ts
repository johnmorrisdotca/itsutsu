import "server-only";

import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { freeGameId } from "./gameId";
import { fixedOpener } from "@/lib/gomoku/rules/creation";
import { SEED_RANGE, STONES, sizeForVariant } from "@/lib/gomoku/gomoku.constants";
import { seedFromRoll } from "@/lib/gomoku/rules/random";
import type { RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { UnwinnableGame, unwinnableBecause } from "./winnableGame";
import { storedHandicap } from "./gameSettingsSchema";
import type { CreatedGame, LiveGameSettings } from "./liveGame.types";
import { UNSETTLED } from "./settledTurn";

/*
 * Making a live game: the row, its seat keys, its first deadline, and the moves
 * a fork copies in. Lifted out of `liveGame.ts` with the row shape
 * (`liveGameRow.ts`) when that file reached the File Size Gate's limit; it is
 * still reached from there, which re-exports it.
 */

/**
 * Starts an empty game and mints a key for each seat. A hot-seat game gets
 * one key for both, and keeps the seed the browser drew, so the board it has
 * already shown is the board the record replays.
 */
export async function createLiveGame(
  input: LiveGameSettings & {
    blackName: string;
    whiteName: string;
    winLength: number;
    opener: Stone;
    hotSeat?: boolean;
    seed?: number;
    /** The accounts holding each seat, for a challenge sent to a named member. */
    blackMemberId?: string;
    whiteMemberId?: string;
    /**
     * The member this game is being PROPOSED to, whose seat is offered rather
     * than bound, and when they were asked. Both or neither — the pair is set
     * together by the creation route, and an offer with no timestamp would be
     * a proposal nobody can date. Every other way of making a game leaves
     * both off.
     */
    offeredToMemberId?: string;
    offeredAt?: Date;
    /** A position to start from: the first `moves` moves of another game are copied in. */
    from?: { id: string; moves: number };
  },
): Promise<CreatedGame> {
  const { handicap, open, hotSeat = false, seed, from, clockMode = "move", rated, ...rest } = input;
  const token = randomBytes(18).toString("base64url");
  const startedAt = new Date();
  const budget = clockMode === "game" ? rest.moveTimeMs : null;

  /*
   * Refuse a game nobody could win, before it is written.
   *
   * The choke point, on purpose: every path that makes a game comes through
   * here, so one check covers the lobby, a challenge, a rematch, a fork, the
   * bot batch, and whatever is written next. A rematch once stored a
   * three-by-three board needing five in a row and nothing objected — John
   * played six moves before finding that his winning move did nothing.
   *
   * Against the size that will actually be STORED rather than the one asked
   * for. A game with a board of its own is created on that board whatever the
   * request said, and a check that read the request would refuse games this
   * very function was about to correct.
   */
  const board = sizeForVariant(rest.variant as RuleVariant, rest.size);
  const cannot = unwinnableBecause({ variant: rest.variant, size: board, winLength: rest.winLength });
  if (cannot !== null) throw new UnwinnableGame(cannot);

  const game = await prisma.game.create({
    data: {
      id: await freeGameId(),
      ...rest,
      // The opener the engine will replay, where the rules fix it — see `fixedOpener`.
      opener: fixedOpener(rest.variant, rest.opening) ?? rest.opener,
      // A game with a board of its own is created on it, whatever was asked for.
      size: sizeForVariant(rest.variant as RuleVariant, rest.size),
      clockMode,
      rated,
      blackTimeMs: budget,
      whiteTimeMs: budget,
      /*
       * NO CLOCK RUNS AGAINST AN OFFER. A game proposed to somebody is waiting
       * on an answer, not on a move, and a deadline stamped here would be a
       * clock ticking against a seat nobody has agreed to sit in — the same
       * reasoning `deadlineFor` gives for a seat still posted on the
       * noticeboard. `acceptOffer` stamps the first deadline at the moment
       * there is somebody to play against, so the opener gets their whole
       * period however long the offer sat unanswered.
       *
       * Written as null rather than left for `deadlineFor` to ignore: a stored
       * value nothing may read is one somebody will eventually read.
       */
      deadlineAt:
        rest.moveTimeMs === null || rest.offeredAt !== undefined
          ? null
          : new Date(startedAt.getTime() + rest.moveTimeMs),
      handicap: storedHandicap(handicap) ?? undefined,
      ...(hotSeat ? { blackToken: token, whiteToken: token } : {}),
      // An open game posts its white seat for anyone; the creator sits as black.
      openSeat: open && !hotSeat ? STONES.white : null,
      openedAt: open && !hotSeat ? new Date() : null,
      // The server draws the seed: the two players must see the same board.
      seed: hotSeat && seed !== undefined ? seed : seedFromRoll(Math.random(), SEED_RANGE),
      // The first deadline runs from the moment the game exists.
      lastMoveAt: startedAt,
      status: "active",
      result: "abandoned",
      moveCount: 0,
    },
    select: { id: true, blackToken: true, whiteToken: true },
  });
  if (from !== undefined && from.moves > 0) {
    const moves = await prisma.move.findMany({
      where: { gameId: from.id, number: { lte: from.moves } },
      orderBy: { number: "asc" },
    });
    await prisma.$transaction([
      prisma.move.createMany({
        data: moves.map(({ id: _id, gameId: _gameId, ...move }) => {
          void _id;
          void _gameId;
          return { ...move, gameId: game.id, cells: move.cells ?? undefined };
        }),
      }),
      /*
       * And says nothing about whose turn it is. A fork copies move ROWS
       * across without ever building a position out of them, so nothing here
       * holds a settled state — and the new game's rules need not be the old
       * one's, so the fact the source row stored is not this game's fact. Null
       * is the honest answer and sends the reader to a replay; a colour copied
       * from somewhere would be a turn nobody had worked out.
       *
       * Written out rather than left to the column default, so that a default
       * added to the schema one day cannot quietly become a forked game's
       * answer.
       */
      prisma.game.update({ where: { id: game.id }, data: { moveCount: moves.length, ...UNSETTLED } }),
    ]);
  }
  return game;
}
