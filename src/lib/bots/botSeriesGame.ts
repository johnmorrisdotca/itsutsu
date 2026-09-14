import "server-only";

import { DEFAULT_SETTINGS, STONES, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import { createLiveGame } from "@/lib/history/liveGame";
import { prisma } from "@/lib/prisma";
import { playBotTurns } from "./botPlay";
import { BOT_MEMBERS } from "./bots.constants";

/**
 * One computer-against-computer game, written and played the way a live game
 * is: created by `createLiveGame`, every move taken by `playBotTurns`, in
 * process, against whatever database Prisma is pointed at.
 *
 * Shared by every mode of `botSeries.play.test.ts` — the fixed round-robins
 * and the mixed plan — so that there is one way a batch makes a game and one
 * way it plays one out. Two copies of this loop would be two answers to "did
 * the batch play it the way the site does", and the one nobody was reading
 * would be the one that drifted.
 */

/**
 * What every game in a batch is, apart from its board and its players.
 *
 * ONE PLACE, so that what the run writes and what it says it wrote cannot
 * drift: the summary at the end and the report at the start both read
 * `SERIES.rated` rather than restating it. The first version wrote these
 * unrated, was made rated in 74c5259, and kept printing "all unrated" for
 * a week afterwards — a claim about a batch that nothing tied to the batch.
 *
 * Rated, because an unrated game is invisible to the thing this exists to
 * fill. `liveGame.ts` only calls `recordResult` when the row says rated, so
 * a batch of these written unrated plays out perfectly, files perfectly —
 * and leaves the computer ladder exactly as empty as it found it. That was
 * the first version, and it would have been a hundred and sixty games played
 * to prove nothing.
 *
 * Safe because the pool is decided by the seats, not by this flag: two
 * programs make a computer-pool game, so these move the ratings the computer
 * ladder reads and can never touch where a person stands among people. That
 * separation is the whole point of `poolFor`.
 */
export const SERIES = {
  // No clock: nobody is waiting, and a deadline would end these on time
  // rather than on the board.
  moveTimeMs: null,
  open: false,
  rated: true,
  // Nobody can be late and nobody will resign, so these carry the ordinary
  // answers rather than anything special.
  timeoutPenalty: "turn",
  allowResign: true,
} as const;

/** The one word the report and the summary use for what `SERIES.rated` says. */
export const RATED_WORD = SERIES.rated ? "rated" : "unrated";

export type SeriesMatch = { variant: RuleVariant; size: number; black: BotTier; white: BotTier };

/** Writes the game row, both seats held by the two computer players. */
export async function createSeriesGame(m: SeriesMatch): Promise<{ id: string }> {
  const black = BOT_MEMBERS[m.black];
  const white = BOT_MEMBERS[m.white];
  const spec = VARIANT_SPECS[m.variant];
  /*
   * Only the fields a live game actually stores. Spreading the engine's
   * DEFAULT_SETTINGS here passed capturesToWin, firstPlayer and the rest,
   * which the row has no columns for — the two types describe different
   * things, and one is not a superset of the other.
   */
  return createLiveGame({
    variant: m.variant,
    size: m.size,
    winLength: spec.winLength ?? DEFAULT_SETTINGS.winLength,
    opener: STONES.black,
    blackName: black.name,
    whiteName: white.name,
    blackMemberId: black.id,
    whiteMemberId: white.id,
    obstacles: DEFAULT_SETTINGS.obstacles,
    opening: DEFAULT_SETTINGS.opening,
    handicap: DEFAULT_SETTINGS.handicap,
    drawLimit: DEFAULT_SETTINGS.drawLimit,
    ...SERIES,
  });
}

export type PlayedOut = {
  /** Whether the row now says finished. Anything else is a game left active. */
  finished: boolean;
  /** How the row reads now, in the words the batch has always printed. */
  detail: string;
  /** The stored result of a finished game: black, white or draw. Null otherwise. */
  result: string | null;
};

/** Calls the same turn-taker a live request does, until the game stops being active. */
export async function playOut(id: string): Promise<PlayedOut> {
  const read = () =>
    prisma.game.findUnique({ where: { id }, select: { status: true, moveCount: true, result: true } });
  const ended = (row: { status: string; moveCount: number; result: string }): PlayedOut => ({
    finished: row.status === "finished",
    detail: `${row.status} after ${row.moveCount} moves`,
    result: row.status === "finished" ? row.result : null,
  });
  // Bounded: playBotTurns takes a limited number of turns per call by design,
  // so this asks repeatedly. A game that never settles is a bug, not a long
  // game, and the cap here says so rather than hanging.
  for (let pass = 0; pass < 400; pass += 1) {
    const row = await read();
    if (row === null) return { finished: false, detail: "vanished", result: null };
    if (row.status !== "active") return ended(row);
    const before = row.moveCount;
    await playBotTurns(id);
    const after = await read();
    if (after === null) return { finished: false, detail: "vanished", result: null };
    if (after.status !== "active") return ended(after);
    // Nothing moved: the players are refusing rather than thinking, and asking
    // again would spin for ever.
    if (after.moveCount === before) {
      return { finished: false, detail: `stuck at ${after.moveCount} moves`, result: null };
    }
  }
  return { finished: false, detail: "unfinished", result: null };
}
