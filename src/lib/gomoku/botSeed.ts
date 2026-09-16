/**
 * The dice a computer player rolls, made reproducible.
 *
 * A grade is not a deterministic player by design: the lower ones blunder on
 * purpose and every one of them drowns some of the heuristic in noise, because
 * an opponent that plays the identical game twice is a puzzle rather than a
 * player. `chooseTurn` therefore takes its randomness as an argument, and in
 * an ordinary game that argument is `Math.random`.
 *
 * It matters that it can be something else. Two callers need the SAME roll to
 * get the same move:
 *
 *  - **Measurement.** Asking five grades what they would play from one position
 *    only says something about the grades if they were handed the same dice.
 *    Otherwise a difference between two of them is the dice and not the grade.
 *  - **Checking a move that was made somewhere we do not control.** A computer
 *    player thinking in the player's own browser is a move chosen on a machine
 *    that belongs to their opponent. Nothing stops somebody making it play
 *    badly and pocketing a rated win. But if the seed is the SERVER's — the
 *    game and the move number, neither of which the browser picks — then the
 *    server can replay any move it likes and see the same answer the honest
 *    browser would have produced.
 *
 * **The budget has to be in nodes for either of those to hold.** A wall-clock
 * budget buys more search on a faster machine, so the same seed and the same
 * position still give different moves on a laptop and on a server, and a replay
 * would accuse an honest player. Positions searched are the same number
 * everywhere; milliseconds are not.
 */

/**
 * A small, fast, fully specified generator.
 *
 * Written out rather than taken from a package because the exact arithmetic IS
 * the contract: a replay that disagrees in the last bit disagrees about the
 * move, and accuses somebody of cheating. Nothing here may be "improved"
 * without invalidating every move already checked against it.
 */
export function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
}

/**
 * The seed for one turn of one game.
 *
 * Both halves come from the server: a game's id and how many moves are already
 * on it. The browser is told the number and never chooses it, so a player who
 * wants a different roll has to change the position instead — which is the
 * move itself, and is checked by the engine like anyone's.
 */
export function seedForTurn(gameId: string, moveNumber: number): number {
  let hash = 2_166_136_261 >>> 0;
  for (let at = 0; at < gameId.length; at += 1) {
    hash ^= gameId.charCodeAt(at);
    hash = Math.imul(hash, 16_777_619) >>> 0;
  }
  hash ^= moveNumber + 0x9e_37_79_b9;
  return Math.imul(hash, 16_777_619) >>> 0;
}
