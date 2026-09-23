import "server-only";

import { isBotId, seatMemberId } from "@/lib/bots/bots";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { recordInbox } from "@/lib/inbox/inbox";
import { INBOX_KINDS } from "@/lib/inbox/inbox.constants";
import { sendNotice } from "@/lib/mail/sendNotice";

/**
 * WHO IS TOLD ABOUT A GAME, decided where the seats are known.
 *
 * Every notice used to be asked for whenever the game was not at one screen,
 * so a seat held by a program was asked for too: a batch of programs' games
 * asked for a your-turn email on every one of its two thousand moves, and a
 * game-over for every game. Notices are switched off (`NOTICES`), so it costs
 * nothing today — and it would the day they are switched on.
 *
 * Nor is it answered by the address book finding no address for a program.
 * That is a plausible "no" standing in for a decision nobody made, and it
 * stops being "no" the day somebody gives the computer players a row with an
 * address on it.
 *
 * This file decides WHO. Whether anything goes, and by what road, is
 * `sendNotice`'s — the one door, next to the caps it has to fit under.
 */

/** The seats a notice is decided from: who holds each, and whether one screen holds both. */
type NoticeSeats = {
  /** A game at one screen: both people are already looking at it. See `isHotSeat`. */
  hotSeat: boolean;
  blackMemberId?: string | null;
  whiteMemberId?: string | null;
  /** For the inbox's line: who was across the board, and at what. */
  blackName?: string;
  whiteName?: string;
  variant?: string;
};

/**
 * The member a notice about this seat is written to, or null when nobody in
 * it can read one. THE RULE, and the only place it is kept.
 *
 * - A game at one screen notifies nobody: both people are sitting at it.
 * - A seat with no member row — a typed name, or a browser holding only a
 *   token — has nobody to address.
 * - A seat held by a program has nobody to read it.
 */
export function noticeRecipient(game: NoticeSeats, stone: Stone): string | null {
  if (game.hotSeat) return null;
  const memberId = seatMemberId(game, stone);
  if (memberId === null || isBotId(memberId)) return null;
  return memberId;
}

/** Tells the seat now to move that it is their turn, when a person holds it. */
export async function noticeYourTurn(game: NoticeSeats, gameId: string, stone: Stone): Promise<void> {
  const memberId = noticeRecipient(game, stone);
  if (memberId === null) return;
  await sendNotice({ kind: "your-turn", gameId, stone, memberId });
}

/** Tells each person seated in a game that it is over; a program's seat is told nothing. */
export async function noticeGameOver(
  game: NoticeSeats,
  gameId: string,
  winner: Stone | null,
  /** False where this "ending" is a refused offer, which the inbox says in its own words. */
  { inbox = true }: { inbox?: boolean } = {},
): Promise<void> {
  for (const stone of [STONES.black, STONES.white]) {
    const memberId = noticeRecipient(game, stone);
    if (memberId !== null) await sendNotice({ kind: "game-over", gameId, winner, stone, memberId });
  }
  if (!inbox) return;
  // The same people, told in the inbox how it went for them — see `inbox.ts`.
  await recordInbox(
    [STONES.black, STONES.white].map((stone) => ({
      memberId: noticeRecipient(game, stone),
      kind: INBOX_KINDS.gameOver,
      gameId,
      variant: game.variant,
      fromName: stone === STONES.black ? game.whiteName : game.blackName,
      fromMemberId: stone === STONES.black ? game.whiteMemberId : game.blackMemberId,
      detail: winner === null ? "drawn" : winner === stone ? "won" : "lost",
    })),
  );
}
