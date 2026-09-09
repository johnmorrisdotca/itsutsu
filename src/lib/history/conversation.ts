import type { GameReaction } from "./gameHistory.types";

/**
 * What the players said, against the moves they said it at.
 *
 * The messages are already kept — every reaction row carries the move number
 * it was sent at — and the record page has thrown all of it away since the
 * feature was built. A finished game is not only its stones: "😱" at move
 * nineteen is part of the game in a way that the same emoji in a list at the
 * bottom of the page is not.
 *
 * So this groups the conversation by the move it belongs to. Pure, and given
 * the reactions rather than fetching them, because the record page already
 * has them and a second read would be a second answer.
 */

/** Everything said at one point in the game, in the order it was said. */
export type ConversationEntry = {
  /**
   * The move it was said at, or null for anything said before the first stone
   * — a "hello" while the seats were being taken belongs at the top, not at
   * move zero, which is a real position somebody could step to.
   */
  moveNumber: number | null;
  said: GameReaction[];
};

/**
 * The conversation in the order it happened, grouped by move.
 *
 * Sorted by the move rather than by the clock. They are usually the same
 * order, and where they are not — a message typed slowly and sent after the
 * next stone landed — the move is the more useful answer, because the reader
 * is stepping through moves and not through timestamps. Within one move the
 * clock decides, so a back-and-forth at a single move still reads in order.
 */
export function conversationFor(
  reactions: readonly GameReaction[],
  { hidden = new Set<string>() }: { hidden?: ReadonlySet<string> } = {},
): ConversationEntry[] {
  const shown = reactions.filter((reaction) => !hidden.has(reaction.stone));
  const byMove = new Map<number | null, GameReaction[]>();
  for (const reaction of shown) {
    const key = reaction.moveNumber === null || reaction.moveNumber <= 0 ? null : reaction.moveNumber;
    const said = byMove.get(key) ?? [];
    said.push(reaction);
    byMove.set(key, said);
  }

  return [...byMove.entries()]
    .map(([moveNumber, said]) => ({
      moveNumber,
      said: [...said].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }))
    // Anything said before the first stone comes first; the rest by move.
    .sort((a, b) => (a.moveNumber ?? -1) - (b.moveNumber ?? -1));
}

/** Whether there is anything to show at all, once the hidden are taken out. */
export function hasConversation(
  reactions: readonly GameReaction[],
  hidden: ReadonlySet<string> = new Set(),
): boolean {
  return reactions.some((reaction) => !hidden.has(reaction.stone));
}

/**
 * How many of the messages carry words rather than only an emoji.
 *
 * Used to decide what to call the section. A row of emoji is a reaction; a
 * game with things typed in it is a conversation, and calling it one when
 * nobody said anything would be a small lie in a heading.
 */
export function spokenCount(reactions: readonly GameReaction[]): number {
  return reactions.filter((reaction) => (reaction.text ?? "").trim() !== "").length;
}
