import type { GameSummary } from "./gameHistory.types";

/**
 * How many of a player's most recent recorded games, newest first, they won in
 * a row. A draw or a loss ends the run; games the player was not in are
 * skipped, since the listing may be a broader filter than one name.
 */
export function winStreak(games: readonly GameSummary[], name: string): number {
  const wanted = name.trim().toLowerCase();
  if (wanted === "") return 0;

  let streak = 0;
  for (const game of games) {
    const black = game.blackName.trim().toLowerCase();
    const white = game.whiteName.trim().toLowerCase();
    if (black !== wanted && white !== wanted) continue;

    const winner =
      game.winner === "black" ? black : game.winner === "white" ? white : null;
    if (winner !== wanted) break;
    streak += 1;
  }
  return streak;
}
