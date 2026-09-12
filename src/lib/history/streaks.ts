import { playerKey } from "@/lib/rating/playerKey";
import { streakFrom, type Streak, type StreakOutcome } from "@/lib/rating/streak";
import type { GameSummary } from "./gameHistory.types";

/**
 * A player's run, read out of a page of games already in hand.
 *
 * The rule itself is `rating/streak.ts` and is not restated here: a draw is its
 * own streak, and no finished games is null rather than nought. This file only
 * answers WHICH SEAT was theirs, which is the part a list of games makes hard.
 *
 * BY MEMBER ID FIRST, AND THAT IS THE FIX. It matched on the folded name
 * alone, and 0.147.0 made that the last name-keyed thing left in the display
 * path. A name is not an identity here: John's daughter renamed from "Hanako
 * Morris" to "Hanachan" on this site's own advice, and a run counted by name
 * SPLITS at the rename — five wins before it and three after read as a run of
 * three, which is a quieter wrong answer than nought would have been.
 *
 * The name is still the fallback, because it is still the only handle on a seat
 * with nobody behind it: a game at one screen, a seat taken from a scanned link
 * with no sign-in, a record kept from another site. Both, in that order, is the
 * same shape `fetchPlayerRecord` and `fetchPlayer` use — the id decides where
 * it is bound and the name answers only where it is not.
 *
 * ONE MORE TRAP, AND IT IS WHY `playedAs` IS READ RATHER THAN `blackName`.
 * `toSummary` now resolves a seat to the member's CURRENT name, so
 * `game.blackName` is a display name and not what the seat was called. For the
 * id path that does not matter. For the name fallback it does: a seat with no
 * member keeps the name it was played under, and that is the one `playedAs`
 * holds.
 */

/** Whose run to read: their member id where there is one, and their name. */
export type Whose = { memberId?: string | null; name: string };

/** Which seat was theirs in this game, or null when neither was. */
function seatOf(game: GameSummary, whose: Whose): "black" | "white" | null {
  const mine = whose.memberId != null && whose.memberId !== "" ? whose.memberId : null;
  if (mine !== null) {
    if (game.blackMemberId === mine) return "black";
    if (game.whiteMemberId === mine) return "white";
  }
  /*
   * The name answers where no id was offered, or where it matched neither
   * seat — a seat with nobody behind it, or a caller that has a name and no
   * way to learn an id. The post-game review note is the second of those: it
   * runs in the browser, and `/api/session` tells a client its address and its
   * name but never its member id.
   *
   * BOTH SPELLINGS, and that is the rename fix on this path. Since 0.147.0
   * `blackName` is the member's CURRENT name and `playedAs` holds the name the
   * seat was played under, so a player who renamed matches under the new name
   * on every game including the old ones. Checking only one of the two would
   * split their run at the rename — five wins before it and three after
   * reading as a run of three, which is quieter and worse than nought.
   */
  const wanted = playerKey(whose.name);
  if (wanted === "") return null;
  const played = game.playedAs ?? { black: game.blackName, white: game.whiteName };
  const isTheirs = (shown: string, as: string) =>
    playerKey(shown) === wanted || playerKey(as) === wanted;
  if (isTheirs(game.blackName, played.black)) return "black";
  if (isTheirs(game.whiteName, played.white)) return "white";
  return null;
}

/**
 * The run this player is on, from a page of games newest first — of any kind,
 * so a losing run and a run of draws are both answers.
 *
 * Games they were not in are skipped rather than ending the run, since the
 * listing may be a broader filter than one player.
 */
export function streakIn(games: readonly GameSummary[], whose: Whose): Streak | null {
  const results: StreakOutcome[] = [];
  for (const game of games) {
    const seat = seatOf(game, whose);
    if (seat === null) continue;
    results.push(game.winner === null ? "draw" : game.winner === seat ? "win" : "loss");
  }
  return streakFrom(results);
}

/**
 * How many they have won in a row, and nought when the newest game was not a
 * win.
 *
 * For the review panel, which says "your third win in a row" and has nothing to
 * say about a run of losses. It is a reading of the streak above rather than a
 * second walk over the games, so the two cannot disagree about where a run
 * starts.
 */
export function winStreak(games: readonly GameSummary[], whose: Whose | string): number {
  const asked: Whose = typeof whose === "string" ? { name: whose } : whose;
  const streak = streakIn(games, asked);
  return streak?.kind === "win" ? streak.count : 0;
}
