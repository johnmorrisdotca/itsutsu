import "server-only";

import { prisma } from "@/lib/prisma";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { fetchGameDetail } from "./gameHistory";
import type { GameDetail } from "./gameHistory.types";
import type { ReactionEmoji } from "./reactions.constants";

/** Why a reaction was refused. Each maps to one HTTP status. */
export type ReactionRefusal = "not-found" | "wrong-token" | "no-such-move";

export type ReactionOutcome =
  | { ok: true; game: GameDetail }
  | { ok: false; reason: ReactionRefusal };

/**
 * Sends one emoji from a seat to the game.
 *
 * The token is checked against the seats exactly as a move is: holding a seat
 * link is the only claim to a colour. A reaction may point at a move that has
 * been played, or at nothing in particular. Finished games still accept them,
 * since "well played" arrives after the last stone.
 */
export async function addReaction(
  id: string,
  token: string,
  emoji: ReactionEmoji,
  moveNumber: number | null,
  text: string | null = null,
): Promise<ReactionOutcome> {
  const row = await prisma.game.findUnique({
    where: { id },
    select: { blackToken: true, whiteToken: true, moveCount: true },
  });
  if (row === null) return { ok: false, reason: "not-found" };

  const stone: Stone | null =
    token === row.blackToken
      ? STONES.black
      : token === row.whiteToken
        ? STONES.white
        : null;
  if (stone === null) return { ok: false, reason: "wrong-token" };
  if (moveNumber !== null && (moveNumber < 1 || moveNumber > row.moveCount)) {
    return { ok: false, reason: "no-such-move" };
  }

  await prisma.reaction.create({ data: { gameId: id, stone, emoji, moveNumber, text } });

  const game = await fetchGameDetail(id);
  if (game === null) return { ok: false, reason: "not-found" };
  return { ok: true, game };
}
