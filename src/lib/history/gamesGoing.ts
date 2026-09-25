import { MY_GAME_GROUPS } from "./myGames.constants";
import type { MyGames } from "./myGames.types";

/**
 * HOW MANY GAMES SOMEBODY HAS GOING: every group of their queue but the
 * finished one — their move, the other player's, offers either way, a seat
 * still waiting for somebody, a game at one screen.
 *
 * John, 2026-09-24: "if we have 10 games going, in our queue, where does it
 * indicate (10)??? … also the Nothing Waiting seems inaccurate… seems like that
 * would be 10 games waiting or in the queue." The strip counted only the games
 * waiting on the reader's move, so ten games on the other side read as nothing
 * at all. One count, read by the strip and by the My games heading, so the two
 * cannot say different numbers.
 */
export function gamesGoing(groups: MyGames): number {
  return MY_GAME_GROUPS.filter((group) => group !== "finished").reduce((total, group) => total + groups[group].length, 0);
}
