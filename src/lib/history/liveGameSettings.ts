import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { SEED_RANGE, STONES, VARIANT_SPECS, sizeForVariant } from "@/lib/gomoku/gomoku.constants";
import { seedFromRoll } from "@/lib/gomoku/rules/random";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { fetchGameDetail } from "./gameHistory";
import { storedHandicap } from "./gameSettingsSchema";
import { GAME_ROW, stoneForToken } from "./liveGame";
import type { LiveGameSettings, SettingsOutcome } from "./liveGame.types";
import { rulesAreSettled } from "./seats";
import { UNSETTLED } from "./settledTurn";

/**
 * Changing a shared game's rules before it starts. Split from liveGame.ts,
 * which keeps creation and the moves themselves, the same way the endings are
 * — a rules change is neither a move nor a new game, and the three were one
 * file only until it ran out of room.
 */

/**
 * WHETHER A CHANGE WOULD MAKE THIS A GAME OF SOMETHING ELSE.
 *
 * A separate question from `rulesAreSettled`, and deliberately not folded into
 * it. That one answers "may any rule still move here", and its answer for a
 * posted seat is yes — one seat taken, the other on the noticeboard, nobody yet
 * to disagree with, so the clock, the board, the opening, the pace and the
 * ratings can all be fixed by whoever is still setting it up. This answers a
 * different question about the same game: "may THIS rule move". For one rule
 * the answer is never, and a name covering both would have to lie about one.
 *
 * THE GAME IS IN THE ADDRESS. `/games/reversi/match/<id>` names it, and so does
 * every seat link handed out under it, every history row, and every link
 * somebody has already sent to somebody else. Change the variant and all of
 * them point at a game that is not there any more. That is a different kind of
 * damage from a clock nobody expected: the clock is on the board in front of
 * you, and a stale address is a lie nobody can see.
 *
 * `MatchPage` redirects a stale slug to the game's real one, and that is a
 * REPAIR for the links already in the wild rather than a licence to make more.
 * It cannot mend a seat token written down, a history row somebody quoted, or
 * anybody's idea of which game they were invited to.
 *
 * So the game is decided before the seat is posted and does not change
 * afterwards. Somebody who chose wrongly cancels a board with no stones on it
 * and sets up the game they meant — one control away, and it cannot be got
 * wrong. That is the same answer `SharedRules` gives about the clock, for the
 * same reason.
 *
 * Asked of the VALUE, not of the key. Every caller sends whole payloads — the
 * setup screen, the route's own schema with its defaults, a script — so a
 * payload names the variant whether or not anybody touched it. Refusing on the
 * field being present would refuse every change there is, which is the failure
 * `rules-settle.spec.ts` names in as many words: a refusal that refuses
 * everything is not a rule.
 */
export function changesTheGame(
  asked: Pick<Partial<LiveGameSettings>, "variant">,
  held: { variant: string },
): boolean {
  return asked.variant !== undefined && asked.variant !== held.variant;
}

/**
 * Changes a shared game's rules. Only a seat holder may, and only while the
 * board is empty: once a stone is down the rules are part of the record. The
 * game itself is never among them — see `changesTheGame`.
 */
export async function updateLiveGameSettings(
  id: string,
  token: string,
  settings: Partial<LiveGameSettings>,
): Promise<SettingsOutcome> {
  const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
  if (row === null) return { ok: false, reason: "not-found" };
  if (row.status !== "active") return { ok: false, reason: "finished" };
  if (stoneForToken(row, token) === null) return { ok: false, reason: "wrong-token" };
  if (row.moves.length > 0) return { ok: false, reason: "started" };
  /*
   * And refused once the other seat is taken, not only once a stone is down.
   * The page stops offering the form at the same moment, but the page is not
   * the only caller — and this is the window the whole setup screen exists to
   * close: rules changed after somebody agreed to them.
   */
  if (rulesAreSettled({ ...row, moveCount: row.moves.length })) {
    return { ok: false, reason: "settled" };
  }
  /*
   * And the game itself is not one of the rules that may move, even here.
   *
   * Asked LAST of the refusals, so it only ever fires in the window the ones
   * above leave open — a game nobody else is in yet. A stone-down game is
   * `started` and a game two people are in is `settled` whatever the payload
   * asks for: in those the whole rule sheet is fixed, and naming one field as
   * the reason would be a smaller truth than the one there is.
   */
  if (changesTheGame(settings, row)) return { ok: false, reason: "different-game" };

  /*
   * A rules change changes the rules it names, and leaves the rest.
   *
   * Every one of these used to arrive with a default already applied, so a
   * payload that said nothing about the clock put the game back on a per-move
   * clock, one that said nothing about `rated` made it rated again, and one
   * that said nothing about the board put it back to fifteen. The panel's own
   * "clear the handicap" button sends exactly such a payload. Measured on the
   * running site: a game created unrated, resignation off, whole-game clock,
   * 9×9 came back from one change rated, resignation on, per-move, 15×15.
   *
   * A default is the right answer to "what shall this be" and the wrong
   * answer to "what was this". The row is the answer to the second, and this
   * function is the only place holding both.
   */
  const kept = <T>(asked: T | undefined, held: T): T => (asked === undefined ? held : asked);
  /*
   * The game's own, never the payload's. `changesTheGame` has just established
   * that the two agree, so reading the row is the same value taken from the one
   * place that cannot come to differ from it. A `kept(settings.variant, …)`
   * here would be correct today and would quietly become the hole again the
   * first time somebody moved that guard.
   */
  const variant = row.variant as RuleVariant;
  const moveTimeMs = kept(settings.moveTimeMs, row.moveTimeMs);
  const clockMode = kept(settings.clockMode, row.clockMode);
  const open = kept(settings.open, row.openSeat !== null);
  const now = new Date();
  const budget = clockMode === "game" ? moveTimeMs : null;
  await prisma.game.update({
    where: { id },
    data: {
      variant,
      obstacles: kept(settings.obstacles, row.obstacles),
      opening: kept(settings.opening, row.opening),
      timeoutPenalty: kept(settings.timeoutPenalty, row.timeoutPenalty),
      allowResign: kept(settings.allowResign, row.allowResign),
      drawLimit: kept(settings.drawLimit, row.drawLimit),
      moveTimeMs,
      // The board this variant has, not the one that was asked for.
      size: sizeForVariant(variant, kept(settings.size, row.size)),
      /*
       * And the line this variant wins on, or the one this game was already
       * being played to. The variant wins where it fixes a length, which is
       * the whole of the Reversi lesson: a game the rules decide is not a
       * game a request may argue with.
       */
      winLength: VARIANT_SPECS[variant].winLength ?? row.winLength,
      clockMode,
      rated: kept(settings.rated, row.rated),
      blackTimeMs: budget,
      whiteTimeMs: budget,
      deadlineAt: moveTimeMs === null ? null : new Date(now.getTime() + moveTimeMs),
      extraMs: 0,
      lastMoveAt: now,
      /*
       * Naming the handicap as null is how it is cleared, so silence and null
       * have to mean different things here: not named at all leaves whatever
       * the game had.
       */
      handicap:
        settings.handicap === undefined
          ? undefined
          : (storedHandicap(settings.handicap) ?? Prisma.JsonNull),
      openSeat: open ? STONES.white : null,
      openedAt: open ? (row.openedAt ?? new Date()) : null,
      seed: seedFromRoll(Math.random(), SEED_RANGE),
      /*
       * And back to saying nothing about whose turn it is, because this is the
       * one path that can change the answer without a stone being played. The
       * opener is re-decided from the rules — `resolveOpener` puts black on
       * move one for every opening protocol and for every variant that
       * constrains the first colour — so a game set up for white to open and
       * then switched to a swap opening is black's move, with the same empty
       * board it had a moment ago. Nothing here holds a settled state to write
       * in its place, so the honest answer is none, and the reader replays.
       */
      ...UNSETTLED,
    },
  });

  const game = await fetchGameDetail(id);
  if (game === null) return { ok: false, reason: "not-found" };
  return { ok: true, game };
}
