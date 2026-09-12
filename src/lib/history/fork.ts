/**
 * Whether a fork control belongs on the screen showing this position.
 *
 * A fork replays a position that could have gone differently — by definition
 * an earlier one. At the final move there is nothing to replay differently,
 * and beside "Play again" it reads as a second rematch button, which is the
 * mix-up John named twice: "People think it's a rematch button." So it only
 * appears once a reader has scrubbed back at least one move.
 *
 * And it is only for somebody who played the game. A spectator forking a
 * game would bind a new game to a player who was never asked — `seated`
 * (whatever the caller's own name for "this reader held a seat" is) gates
 * it the same way the rest of a match's seat-only controls already are.
 *
 * | move < last | seated | offered |
 * | ----------- | ------ | ------- |
 * | true        | true   | true    |
 * | true        | false  | false   |
 * | false       | true   | false   |
 * | false       | false  | false   |
 */
export function forkOffered({
  move,
  last,
  seated,
}: {
  /** The position on screen right now — the move the reader has scrubbed to. */
  move: number;
  /** The game's final move: the one position a fork can never usefully start from. */
  last: number;
  /** Whether this reader held a seat in the game, rather than only watching it. */
  seated: boolean;
}): boolean {
  return seated && move < last;
}
