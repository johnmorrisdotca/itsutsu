import { hitotsuJumpIns, hitotsuMoves } from "./rules.ts";
import type { HitotsuCard, HitotsuGame, HitotsuMove } from "./types.ts";

/**
 * ONE SEAT'S VIEW OF WHAT IT MAY DO: the questions a table asks the rules for
 * the player holding a hand — a table on one device and a table on several
 * alike, whatever draws them.
 */

/** A move that puts a card down: in turn, or jumping in. */
export type HitotsuCardMove = Extract<HitotsuMove, { play: HitotsuCard }> | Extract<HitotsuMove, { jump: HitotsuCard }>;

/** The card a card move puts down. */
export const cardOfMove = (move: HitotsuCardMove): HitotsuCard => ("play" in move ? move.play : move.jump);

/** Everything this seat may do now: its own turn's moves, or, at another's turn, the cards it may jump in with. */
export function movesFor(game: HitotsuGame, seat: number): HitotsuMove[] {
  if (game.toPlay === seat) return hitotsuMoves(game);
  return hitotsuJumpIns(game).filter((move) => "jump" in move && move.seat === seat);
}

/** The cards this seat may play now, in turn or jumping in. */
export function playableFor(game: HitotsuGame, seat: number): HitotsuCard[] {
  return [...new Set(movesFor(game, seat).flatMap((move) => ("play" in move ? [move.play] : "jump" in move ? [move.jump] : [])))];
}

/** Whether the call is a choice now: this seat is about to play its second-last card. */
export function callMatters(game: HitotsuGame, seat: number): boolean {
  return movesFor(game, seat).some((move) => ("play" in move || "jump" in move) && move.call === true);
}

/** The ways this card may go down, the call made or not as the player said (where that is a choice). */
export function waysFor(game: HitotsuGame, seat: number, card: HitotsuCard, call: boolean): HitotsuCardMove[] {
  const matters = callMatters(game, seat);
  return movesFor(game, seat)
    .filter((move): move is HitotsuCardMove => ("play" in move || "jump" in move) && cardOfMove(move) === card)
    .filter((move) => (move.call === true) === call || !matters);
}

/** What a card tapped twice plays: its one way, or null where there is a colour or a seat to choose. */
export function quickMove(game: HitotsuGame, seat: number, card: HitotsuCard, call: boolean): HitotsuMove | null {
  const ways = waysFor(game, seat, card, call);
  return ways.length === 1 ? ways[0]! : null;
}
