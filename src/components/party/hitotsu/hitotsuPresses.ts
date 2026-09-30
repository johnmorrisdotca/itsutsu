import { HITOTSU_COLOUR_LOOK, colourWords, movesFor, waysFor, type HitotsuCard, type HitotsuGame, type HitotsuMove } from "@johnmorrisdotca/hitotsu";

import { HITOTSU_COPY } from "./hitotsu.constants";

export { callMatters, movesFor, playableFor, quickMove } from "@johnmorrisdotca/hitotsu";

/** A press the player may make: its words, the move (null while it cannot be made), and why not. */
export type HitotsuPress = { label: string; move: HitotsuMove | null; testId: string; strong?: boolean; why?: string; colour?: string };

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
