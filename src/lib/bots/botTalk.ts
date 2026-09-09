import "server-only";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { addReaction } from "@/lib/history/reactions";
import { BOT_PHRASES, type ReactionEmoji } from "@/lib/history/reactions.constants";
import { prisma } from "@/lib/prisma";
import { botInSeat } from "./bots";

/**
 * The computer players' manners.
 *
 * John played a game of draughts against Dan, said hello and thank you with
 * the buttons that sit under every board, and Dan said nothing — not at the
 * start and not at the end. The three of them are meant to be players in
 * their own right: they hold a seat, they carry a rating, they have a page.
 * Silence made them feel like a mechanism instead of an opponent, and this is
 * the cheapest place to keep that from being true.
 *
 * They say exactly two things, at the two moments a person would say them,
 * and both come from the same list of phrases a person is offered. Nothing
 * mid-game and nothing invented: a program should not be able to say anything
 * a player cannot.
 *
 * It goes through `addReaction` with the seat's own token, which is the same
 * path a person's message takes — so it is kept with the finished game, it
 * appears in the record, and the ignore and mute rules apply to it without
 * anything here knowing about them.
 */

type Seats = {
  blackToken: string;
  whiteToken: string;
  blackMemberId?: string | null;
  whiteMemberId?: string | null;
};

function tokenFor(row: Seats, stone: Stone): string {
  return stone === STONES.black ? row.blackToken : row.whiteToken;
}

/**
 * Whether this seat has already said this, so a game cannot collect a row of
 * hellos.
 *
 * Asked of the reactions themselves rather than remembered on the game. The
 * turn loop runs again on every request that touches the game, and a computer
 * may take several turns in one of them; the record of what has been said is
 * the only thing that is true across all of that.
 */
async function alreadySaid(id: string, stone: Stone, text: string): Promise<boolean> {
  const said = await prisma.reaction.findFirst({
    where: { gameId: id, stone, text },
    select: { id: true },
  });
  return said !== null;
}

async function say(
  id: string,
  row: Seats,
  stone: Stone,
  phrase: { emoji: ReactionEmoji; text: string },
): Promise<void> {
  if (await alreadySaid(id, stone, phrase.text)) return;
  await addReaction(id, tokenFor(row, stone), phrase.emoji, null, phrase.text);
}

/**
 * A greeting from the computer, before the first stone it plays.
 *
 * Said once, by the seat that is about to move, and only where a person is
 * sitting opposite: two computers playing each other exchanging pleasantries
 * would be a joke at the expense of the thing it is trying to do.
 */
export async function greetFromBot(id: string, row: Seats, stone: Stone): Promise<void> {
  if (botInSeat(row, stone) === null) return;
  const other = stone === STONES.black ? STONES.white : STONES.black;
  if (botInSeat(row, other) !== null) return;
  await say(id, row, stone, BOT_PHRASES.hello);
}

/**
 * Thank you for the game, once it is over — however it ended.
 *
 * A resignation, a win, a draw and a flag that fell are all games that were
 * played, and a person thanks their opponent for every one of them. Said by
 * whichever seats a computer holds, so the losing side says it too.
 */
export async function farewellFromBots(id: string, row: Seats): Promise<void> {
  for (const stone of [STONES.black, STONES.white] as const) {
    if (botInSeat(row, stone) === null) continue;
    const other = stone === STONES.black ? STONES.white : STONES.black;
    if (botInSeat(row, other) !== null) continue;
    await say(id, row, stone, BOT_PHRASES.goodGame);
  }
}
