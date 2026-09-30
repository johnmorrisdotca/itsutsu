import { hitotsuJumpIns, hitotsuMoves } from "@/lib/party/hitotsu/hitotsu";
import { colourWords } from "@/lib/party/hitotsu/hitotsuDeck";
import type { HitotsuCard, HitotsuGame, HitotsuMove } from "@/lib/party/hitotsu/hitotsu.types";

import { HITOTSU_COLOUR_LOOK, HITOTSU_COPY } from "./hitotsu.constants";

/** A press the player may make: its words, the move (null while it cannot be made), and why not. */
export type HitotsuPress = { label: string; move: HitotsuMove | null; testId: string; strong?: boolean; why?: string; colour?: string };

type CardMove = Extract<HitotsuMove, { play: HitotsuCard }> | Extract<HitotsuMove, { jump: HitotsuCard }>;
const cardOf = (move: CardMove) => ("play" in move ? move.play : move.jump);

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
function waysFor(game: HitotsuGame, seat: number, card: HitotsuCard, call: boolean): CardMove[] {
  return movesFor(game, seat)
    .filter((move): move is CardMove => ("play" in move || "jump" in move) && cardOf(move) === card)
    .filter((move) => (move.call === true) === call || !callMatters(game, seat));
}

/** What a card tapped twice plays: its one way, or null where there is a colour or a seat to choose. */
export function quickMove(game: HitotsuGame, seat: number, card: HitotsuCard, call: boolean): HitotsuMove | null {
  const ways = waysFor(game, seat, card, call);
  return ways.length === 1 ? ways[0] : null;
}

/**
 * THE PRESSES UNDER A HAND, with this card chosen: Play (or Jump in), one per
 * colour for a wild, one per player for a seven that swaps; then Draw, Keep
 * it, Pass, Take, Challenge — whichever the rules offer now.
 */
export function hitotsuPresses(game: HitotsuGame, seat: number, chosen: HitotsuCard | null, call: boolean, name: (seat: number) => string): HitotsuPress[] {
  const moves = movesFor(game, seat);
  if (moves.length === 0) return [];
  const mine = game.toPlay === seat;
  const presses: HitotsuPress[] = [];
  const ways = chosen === null ? [] : waysFor(game, seat, chosen, call);
  const jumping = !mine;
  if (ways.some((way) => way.colour !== undefined)) {
    for (const way of ways) {
      const colour = way.colour!;
      presses.push({ label: HITOTSU_COPY.callColour(colourWords(colour)), move: way, testId: `hitotsu-colour-${colour}`, strong: true, colour: HITOTSU_COLOUR_LOOK[colour].fill });
    }
  } else if (ways.some((way) => way.swap !== undefined)) {
    for (const way of ways) presses.push({ label: HITOTSU_COPY.swapWith(name(way.swap!)), move: way, testId: `hitotsu-swap-${way.swap}`, strong: true });
  } else if (mine || chosen !== null) {
    presses.push({
      label: jumping ? HITOTSU_COPY.jumpIn : HITOTSU_COPY.play,
      move: ways[0] ?? null,
      testId: jumping ? "hitotsu-jump" : "hitotsu-play",
      strong: true,
      why: chosen === null ? HITOTSU_COPY.playWhy : HITOTSU_COPY.notThat,
    });
  }
  for (const move of moves) {
    if ("draw" in move) presses.push({ label: HITOTSU_COPY.draw, move, testId: "hitotsu-draw" });
    if ("pass" in move) presses.push({ label: game.drawn !== null ? HITOTSU_COPY.keep : HITOTSU_COPY.pass, move, testId: "hitotsu-pass" });
    if ("take" in move) presses.push({ label: HITOTSU_COPY.take(game.pending), move, testId: "hitotsu-take" });
    if ("challenge" in move) presses.push({ label: HITOTSU_COPY.challenge, move, testId: "hitotsu-challenge" });
  }
  return presses;
}

/** The line over the table: whose turn it is and what they are to do. */
export function hitotsuStatus(game: HitotsuGame, name: (seat: number) => string): string {
  if (game.toPlay === null) return "";
  const who = name(game.toPlay);
  if (game.challenge !== null) return HITOTSU_COPY.challengeOpen(who, name(game.challenge.by));
  if (game.pending > 0) return HITOTSU_COPY.facing(who, game.pending);
  if (game.drawn !== null) return HITOTSU_COPY.drew(who);
  return `${HITOTSU_COPY.toPlay(who)}: ${colourWords(game.colour)}, or the same number or symbol, or a wild.`;
}

/** What the last move did beyond the card, in words: "Ben took four.", "Cy was caught: two cards." */
export function hitotsuNewsLine(game: HitotsuGame, name: (seat: number) => string): string {
  return game.news
    .map((news) => {
      switch (news.kind) {
        case "caught":
          return `${name(news.seat)} forgot to call Hitotsu!: two cards.`;
        case "took":
          return `${name(news.seat)} took ${news.count}.`;
        case "challenge":
          return news.guilty ? `${name(news.seat)} challenged ${name(news.by)}, who had the colour.` : `${name(news.seat)} challenged ${name(news.by)}, who did not have the colour.`;
        case "swap":
          return `${name(news.seat)} swapped hands with ${name(news.with)}.`;
        case "rotate":
          return "Every hand passed on.";
        case "jump":
          return `${name(news.seat)} jumped in!`;
        case "skipped":
          return `${name(news.seat)} is skipped.`;
        case "reversed":
          return "Play turns round.";
        case "drew":
          return `${name(news.seat)} drew ${news.count === 1 ? "a card" : `${news.count} cards`}.`;
      }
    })
    .join(" ");
}
