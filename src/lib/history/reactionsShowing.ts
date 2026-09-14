import type { GameReaction } from "./gameHistory.types";
import { REACTION_SHOW_MS } from "./reactions.constants";

/**
 * The reactions new enough to still be floating over the board, at `now`.
 *
 * `now` IS NULL UNTIL THE BROWSER HAS THE PAGE, and null shows nothing. The
 * server draws the board too, and its clock is not the browser's: a reaction
 * that expires in the instant the page loads was fresh for one drawing and
 * stale for the other, and React throws the server's markup away. A bubble is
 * a few seconds of courtesy, not a record — `ReactionLog` keeps the last few
 * on the page — so "not known yet" drawing nothing for one render loses
 * nothing, where a guess drawn on both sides would be the fault itself.
 */
export function reactionsShowing(reactions: readonly GameReaction[], now: number | null): GameReaction[] {
  if (now === null) return [];
  return reactions.filter((reaction) => now - new Date(reaction.createdAt).getTime() < REACTION_SHOW_MS);
}
