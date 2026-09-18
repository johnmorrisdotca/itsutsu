/**
 * One game waiting on a computer's move, and the key this browser may make it
 * with.
 *
 * The key is this reader's own seat, resolved on the server — see
 * `catchUpSeats.ts` for who is given one and `BotCatchUp` for what is done
 * with it.
 */
export type CatchUpSeat = {
  id: string;
  /** The seat key for the colour this reader holds in that game. */
  token: string;
};
